import "server-only";
import { prisma } from "@/lib/prisma";
import { normalisePhone } from "@/lib/player-filters";
import { ageCheck, pendingNeighbours } from "@/lib/registration-review";
import { mightBeMinor } from "@/lib/age-category";
import { normalizeStatus } from "@/lib/registration-status";

/** Everything the admin registration page shows, in one round of queries. */
export async function getRegistrationDetail(id: string) {
  const r = await prisma.registration.findUnique({
    where: { id },
    include: {
      tournament: {
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          venue: true,
          city: true,
        },
      },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!r) return null;

  const [siblings, pending] = await Promise.all([
    prisma.registration.findMany({
      where: { tournamentId: r.tournamentId, id: { not: r.id } },
      select: {
        id: true,
        fullName: true,
        registrationNo: true,
        phone: true,
        email: true,
        status: true,
      },
    }),
    prisma.registration.findMany({
      where: { tournamentId: r.tournamentId, status: "pending" },
      select: { id: true, registeredAt: true },
    }),
  ]);

  // Same tournament, same phone (any formatting) or same email: a flag for a human, never a block.
  const phone = normalisePhone(r.phone);
  const email = r.email.trim().toLowerCase();
  const duplicates = siblings
    .map((s) => ({
      ...s,
      samePhone: phone !== "" && normalisePhone(s.phone) === phone,
      sameEmail: s.email.trim().toLowerCase() === email,
    }))
    .filter((s) => s.samePhone || s.sameEmail);

  const age = ageCheck(r.dob, r.tournament.startDate, r.ageCategory);
  const needsGuardian =
    age !== null && mightBeMinor(age.birthYear) && !(r.guardianConsent && r.guardianName);

  // Legacy rows have the files inline; current ones in S3.
  const documents = {
    photo: Boolean(r.passportPhotoKey || r.passportPhotoData),
    photoLegacy: !r.passportPhotoKey && Boolean(r.passportPhotoData),
    ageProof: Boolean(r.ageProofKey || r.aadhaarImageData),
    ageProofLegacy: !r.ageProofKey && Boolean(r.aadhaarImageData),
    ageProofIsPdf: r.ageProofKey
      ? r.ageProofKey.toLowerCase().endsWith(".pdf")
      : Boolean(r.aadhaarImageData?.startsWith("data:application/pdf")),
  };

  return {
    // The inline legacy files can be megabytes; they're served by the uploads route instead.
    registration: {
      ...r,
      passportPhotoData: null,
      aadhaarImageData: null,
      status: normalizeStatus(r.status),
    },
    duplicates,
    age,
    needsGuardian,
    documents,
    queue: pendingNeighbours(pending, r),
  };
}

export type RegistrationDetail = NonNullable<Awaited<ReturnType<typeof getRegistrationDetail>>>;
