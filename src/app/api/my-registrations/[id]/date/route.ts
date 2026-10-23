import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";
import { getOwnedRegistration, getPlayerEmail } from "@/lib/player-session";
import { recordRegistrationEvent } from "@/lib/registration-events";
import { SEAT_HOLDING_STATUSES, normalizeStatus } from "@/lib/registration-status";

/** The signed-in player confirms they'll play on the tournament's new date. (Withdrawing goes through /withdraw.) */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isReadOnly()) return readOnlyResponse();
  const email = await getPlayerEmail();
  if (!email) {
    return NextResponse.json(
      { error: "Your sign-in has expired. Please sign in again.", signIn: true },
      { status: 401 }
    );
  }
  const { id } = await params;
  const r = await getOwnedRegistration(id, email);
  if (!r) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  if (
    r.dateChangeResponse !== "pending" ||
    !SEAT_HOLDING_STATUSES.includes(normalizeStatus(r.status))
  ) {
    return NextResponse.json({ error: "There's no new date to confirm." }, { status: 409 });
  }
  await prisma.registration.update({
    where: { id },
    data: { dateChangeResponse: "accepted", dateChangeRespondedAt: new Date() },
  });
  await recordRegistrationEvent(prisma, {
    registrationId: id,
    type: "date_change_confirmed",
    actor: { type: "player", email },
    note: "Will play on the new date",
  });
  for (const path of [
    "/my-registration",
    `/registration/${id}`,
    `/admin/registrations/${id}`,
    "/admin",
  ]) {
    revalidatePath(path);
  }
  return NextResponse.json({ ok: true });
}
