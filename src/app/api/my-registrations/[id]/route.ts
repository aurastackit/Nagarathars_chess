import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";
import { getOwnedRegistration, getPlayerEmail } from "@/lib/player-session";
import { createRegistrationWizardSchema } from "@/lib/registration-schema";
import { ageByYear, naturalAgeCategory } from "@/lib/age-category";
import { canPlayerEdit, isAcceptableUploadKey } from "@/lib/self-service";
import { normalizeStatus } from "@/lib/registration-status";
import { StaleStatusError, changeRegistrationStatus } from "@/lib/registration-workflow";
import { recordRegistrationEvent } from "@/lib/registration-events";
import { emailRegistration } from "@/lib/registration-notify";
import { checkUploadedDocuments } from "@/lib/upload-verify";
import { deleteObjects } from "@/lib/s3";

const LABEL: Record<string, string> = {
  fullName: "name",
  phone: "mobile",
  dob: "year of birth",
  gender: "gender",
  city: "city",
  address: "address",
  rating: "rating",
  fideId: "FIDE ID",
  fatherName: "father's name",
  motherName: "mother's name",
  fatherGrandparents: "father's grandparents",
  motherGrandparents: "mother's grandparents",
  native: "native",
  kovil: "kovil",
  pirivu: "pirivu",
  motherNative: "mother's native",
  motherKovil: "mother's kovil",
  motherPirivu: "mother's pirivu",
  sangamMember: "Sangam",
  sangamRelativeName: "Sangam relative",
  ageProofType: "age proof type",
  ageProofKey: "age proof",
  passportPhotoKey: "photo",
  guardianName: "guardian",
  guardianConsent: "guardian consent",
};

const fail = (error: string, status: number, extra: object = {}) =>
  NextResponse.json({ error, ...extra }, { status });

/**
 * A player updates their own application (signed in at /my-registration).
 * It goes (back) to review: status pending, an "edited" timeline entry, and the
 * "Application received" email again. Replaced documents are deleted.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isReadOnly()) return readOnlyResponse();
  if (!checkRateLimit(`my-update:${getClientIp(req)}`, 20, 10 * 60_000)) {
    return fail("Too many requests — please try again shortly.", 429);
  }
  const email = await getPlayerEmail();
  if (!email) return fail("Your sign-in has expired. Please sign in again.", 401, { signIn: true });
  const { id } = await params;
  const r = await getOwnedRegistration(id, email);
  if (!r) return fail("Registration not found", 404);
  if (!canPlayerEdit(r.status, r.tournament.startDate)) {
    return fail("This registration can't be changed any more. Please contact the organisers.", 409);
  }

  const body = await req.json().catch(() => null);
  // The email is how the player signed in: it can't be changed here.
  const parsed = createRegistrationWizardSchema().safeParse({ ...body, email: r.email });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.message ?? "Please check the form", 400, { field: issue?.path?.[0] });
  }
  const d = parsed.data;
  if (
    !isAcceptableUploadKey(d.ageProofKey, "ageProof", r.tournament.slug, r.ageProofKey) ||
    !isAcceptableUploadKey(
      d.passportPhotoKey,
      "passportPhoto",
      r.tournament.slug,
      r.passportPhotoKey
    )
  ) {
    return fail("Please upload your documents again.", 400);
  }
  const replaced = {
    ageProof: d.ageProofKey !== r.ageProofKey,
    passportPhoto: d.passportPhotoKey !== r.passportPhotoKey,
  };
  const documentProblem = await checkUploadedDocuments([
    ...(replaced.ageProof ? [{ kind: "ageProof" as const, key: d.ageProofKey }] : []),
    ...(replaced.passportPhoto
      ? [{ kind: "passportPhoto" as const, key: d.passportPhotoKey }]
      : []),
  ]);
  if (documentProblem) return fail(documentProblem.problem, 400, { field: documentProblem.field });

  const fields = {
    fullName: d.fullName,
    phone: d.phone,
    dob: new Date(Date.UTC(d.birthYear, 0, 1)),
    gender: d.gender,
    city: d.city,
    address: d.address,
    rating: d.rating ? Number(d.rating) : null,
    fideId: d.fideId || null,
    fatherName: d.fatherName,
    motherName: d.motherName,
    fatherGrandparents: d.fatherGrandparents,
    motherGrandparents: d.motherGrandparents,
    native: d.native,
    kovil: d.kovil,
    pirivu: d.pirivu,
    motherNative: d.motherNative,
    motherKovil: d.motherKovil,
    motherPirivu: d.motherPirivu,
    sangamMember: d.sangamMember,
    sangamRelativeName: d.sangamMember ? d.sangamRelativeName || null : null,
    ageProofType: d.ageProofType,
    ageProofKey: d.ageProofKey,
    passportPhotoKey: d.passportPhotoKey,
    // A new upload replaces an inline copy from the old form.
    ...(replaced.ageProof && { aadhaarImageData: null }),
    ...(replaced.passportPhoto && { passportPhotoData: null }),
    consentAccepted: d.consentAccepted,
    guardianName: d.guardianName || null,
    guardianConsent: d.guardianConsent,
    // The category always follows the year of birth.
    ageCategory: naturalAgeCategory(ageByYear(d.birthYear, r.tournament.startDate)),
  };
  const before = r as unknown as Record<string, unknown>;
  const changed = Object.entries(fields)
    .filter(([k, v]) => {
      const old = before[k];
      return old instanceof Date && v instanceof Date
        ? old.getTime() !== v.getTime()
        : (old ?? null) !== (v ?? null);
    })
    .map(([k]) => LABEL[k])
    .filter(Boolean);
  const note = changed.length ? `Updated: ${changed.join(", ")}` : "Resubmitted without changes";

  const from = normalizeStatus(r.status);
  try {
    if (from === "pending") {
      // Still waiting for review: save the edit, record it, stay pending.
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.registration.updateMany({
          where: { id, status: r.status },
          data: fields,
        });
        if (count !== 1) throw new StaleStatusError();
        await recordRegistrationEvent(tx, {
          registrationId: id,
          type: "edited",
          actor: { type: "player", email },
          note,
        });
      });
    } else {
      await changeRegistrationStatus({
        registrationId: id,
        to: "pending",
        actor: { type: "player", email },
        note,
        expectFrom: from,
        data: fields,
      });
    }
  } catch (err) {
    if (err instanceof StaleStatusError) {
      return fail(
        "Your registration was just updated by the organisers. Please reload the page.",
        409
      );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return fail(
        "Another registration for this email already has that year of birth in this tournament.",
        409,
        { field: "birthYear" }
      );
    }
    throw err;
  }

  // The files they replaced aren't kept.
  const old = [
    replaced.ageProof && r.ageProofKey,
    replaced.passportPhoto && r.passportPhotoKey,
  ].filter((k): k is string => Boolean(k));
  if (old.length) {
    const { failed } = await deleteObjects(old);
    if (failed.length) console.error("[my-registration] could not delete replaced files:", failed);
  }

  await emailRegistration(id, "received", { label: "Application received (updated)" });
  for (const path of [
    "/my-registration",
    `/registration/${id}`,
    `/admin/registrations/${id}`,
    "/admin/registrations",
    "/admin",
  ]) {
    revalidatePath(path);
  }
  return NextResponse.json({ ok: true, changed });
}
