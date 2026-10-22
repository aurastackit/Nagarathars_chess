"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkActionQuery } from "@/lib/email/action-links";
import { isReadOnly, READ_ONLY_MESSAGE } from "@/lib/read-only";
import { recordRegistrationEvent } from "@/lib/registration-events";
import { StaleStatusError, changeRegistrationStatus } from "@/lib/registration-workflow";
import {
  InvalidTransitionError,
  SEAT_HOLDING_STATUSES,
  normalizeStatus,
} from "@/lib/registration-status";
import { emailForStatusChange } from "@/lib/registration-notify";
import { revalidateTournamentSeats } from "@/lib/revalidate-public";

export type RespondResult = { ok: boolean; message: string } | null;

const CANT_MAKE_IT = "Can't make the new tournament date";

/** The player's answer to a date change, authorised by the signed link from their email. */
export async function respondToDateChange(
  _state: RespondResult,
  formData: FormData
): Promise<RespondResult> {
  if (isReadOnly()) return { ok: false, message: READ_ONLY_MESSAGE };
  const id = String(formData.get("id") ?? "");
  const check = checkActionQuery(
    id,
    { a: String(formData.get("a")), e: String(formData.get("e")), t: String(formData.get("t")) },
    process.env.AUTH_SECRET ?? ""
  );
  if (!check.ok) {
    return { ok: false, message: "This link isn't valid any more. Please use your latest email." };
  }
  const r = await prisma.registration.findUnique({
    where: { id },
    select: { email: true, status: true, tournament: { select: { slug: true } } },
  });
  if (!r) return { ok: false, message: "This registration no longer exists." };
  const player = { type: "player" as const, email: r.email };

  if (check.action === "confirm-date") {
    if (!SEAT_HOLDING_STATUSES.includes(normalizeStatus(r.status))) {
      return {
        ok: false,
        message: "This registration isn't active any more, so there's nothing to confirm.",
      };
    }
    await prisma.registration.update({
      where: { id },
      data: { dateChangeResponse: "accepted", dateChangeRespondedAt: new Date() },
    });
    await recordRegistrationEvent(prisma, {
      registrationId: id,
      type: "date_change_confirmed",
      actor: player,
      note: "Will play on the new date",
    });
    revalidatePath(`/registration/${id}`);
    revalidatePath(`/admin/registrations/${id}`);
    revalidatePath("/admin");
    return { ok: true, message: "Thank you — you're confirmed for the new date. See you there!" };
  }

  try {
    await changeRegistrationStatus({
      registrationId: id,
      to: "withdrawn",
      actor: player,
      reason: CANT_MAKE_IT,
    });
  } catch (err) {
    if (err instanceof InvalidTransitionError || err instanceof StaleStatusError) {
      return { ok: false, message: "This registration can't be withdrawn any more." };
    }
    throw err;
  }
  await prisma.registration.update({
    where: { id },
    data: { dateChangeResponse: "declined", dateChangeRespondedAt: new Date() },
  });
  await emailForStatusChange(id, "withdrawn", { reason: CANT_MAKE_IT, byPlayer: true });
  revalidatePath(`/registration/${id}`);
  revalidatePath(`/admin/registrations/${id}`);
  revalidatePath("/admin");
  revalidateTournamentSeats(r.tournament.slug);
  return {
    ok: true,
    message:
      "Your registration has been withdrawn and your seat released. We've emailed you a confirmation.",
  };
}
