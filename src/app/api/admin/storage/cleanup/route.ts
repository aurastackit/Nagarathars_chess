import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/audit-log";
import { deleteObjects } from "@/lib/s3";

const schema = z.object({ keys: z.array(z.string().trim().min(1).max(300)).min(1).max(50) });

/**
 * Admin-only: deletes stored files that no registration uses any more (e.g.
 * left behind by a registration deleted before deletes removed its files).
 * Refuses any key a registration still points to, and anything outside the
 * registration documents and ID-card cache.
 */
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send { keys: [...] }" }, { status: 400 });
  const keys = [...new Set(parsed.data.keys)];

  const outside = keys.filter((k) => !/^(registrations|id-cards)\//.test(k));
  if (outside.length) {
    return NextResponse.json(
      { error: `Not a registration document: ${outside.join(", ")}` },
      { status: 400 }
    );
  }
  const docKeys = keys.filter((k) => k.startsWith("registrations/"));
  const cardOwners = keys.filter((k) => k.startsWith("id-cards/")).map((k) => k.split("/")[1]);
  const inUse = await prisma.registration.findMany({
    where: {
      OR: [
        { passportPhotoKey: { in: docKeys } },
        { ageProofKey: { in: docKeys } },
        { id: { in: cardOwners } },
      ],
    },
    select: { registrationNo: true, id: true },
  });
  if (inUse.length) {
    return NextResponse.json(
      {
        error: `Still used by ${inUse.map((r) => r.registrationNo ?? r.id).join(", ")} — delete the registration instead.`,
      },
      { status: 409 }
    );
  }

  const result = await deleteObjects(keys);
  await logAdminAction({
    actorEmail: session.user!.email!,
    action: "storage.cleanup",
    targetType: "Registration",
    targetId: keys[0],
    summary: `Removed ${result.deleted.length} unused stored file(s)${result.failed.length ? `; ${result.failed.length} failed: ${result.failed.map((f) => `${f.key} (${f.error})`).join(", ")}` : ""}`,
  });
  return NextResponse.json(result, { status: result.failed.length ? 502 : 200 });
}
