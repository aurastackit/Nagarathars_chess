import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isReadOnly, readOnlyResponse } from "@/lib/read-only";
import { getOwnedRegistration, getPlayerEmail } from "@/lib/player-session";
import { canPlayerWithdraw } from "@/lib/self-service";
import { InvalidTransitionError, normalizeStatus } from "@/lib/registration-status";
import { StaleStatusError, changeRegistrationStatus } from "@/lib/registration-workflow";
import { emailForStatusChange } from "@/lib/registration-notify";
import { revalidateTournamentSeats } from "@/lib/revalidate-public";

const schema = z.object({
  reason: z.string().trim().min(3, "Tell us briefly why you're withdrawing").max(300),
});

/** A player withdraws their own registration (with a reason). Final: the seat is released. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isReadOnly()) return readOnlyResponse();
  if (!checkRateLimit(`my-withdraw:${getClientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }
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
  if (!canPlayerWithdraw(r.status, r.tournament.endDate)) {
    return NextResponse.json({ error: "This registration can't be withdrawn." }, { status: 409 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    await changeRegistrationStatus({
      registrationId: id,
      to: "withdrawn",
      actor: { type: "player", email },
      reason: parsed.data.reason,
      expectFrom: normalizeStatus(r.status),
      // Withdrawing answers a pending date-change question too.
      ...(r.dateChangeResponse === "pending" && {
        data: { dateChangeResponse: "declined", dateChangeRespondedAt: new Date() },
      }),
    });
  } catch (err) {
    if (err instanceof StaleStatusError || err instanceof InvalidTransitionError) {
      return NextResponse.json(
        { error: "This registration was just changed. Please reload the page." },
        { status: 409 }
      );
    }
    throw err;
  }
  await emailForStatusChange(id, "withdrawn", { reason: parsed.data.reason, byPlayer: true });
  for (const path of [
    "/my-registration",
    `/registration/${id}`,
    `/admin/registrations/${id}`,
    "/admin/registrations",
    "/admin",
  ]) {
    revalidatePath(path);
  }
  revalidateTournamentSeats(r.tournament.slug);
  return NextResponse.json({ ok: true });
}
