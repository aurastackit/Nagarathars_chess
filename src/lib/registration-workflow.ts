import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { newVerifyToken } from "@/lib/id-card/verify-token";
import { TRANSACTION_TIMEOUTS } from "@/lib/registration-number";
import { recordRegistrationEvent, type EventActor } from "@/lib/registration-events";
import {
  assertTransition,
  eventTypeFor,
  normalizeStatus,
  type RegistrationStatus,
} from "@/lib/registration-status";

/** Someone else changed the registration between reading and writing it. */
export class StaleStatusError extends Error {
  constructor() {
    super("This registration was changed by someone else. Reload and try again.");
    this.name = "StaleStatusError";
  }
}

/**
 * The one way to change a registration's status. Checks the transition is
 * allowed for this actor (src/lib/registration-status.ts), writes the status
 * and its bookkeeping fields only if the status is still what was read (so two
 * admins can't overwrite each other), and records the timeline event — all in
 * one transaction. Sending emails is up to the caller.
 */
export async function changeRegistrationStatus(params: {
  registrationId: string;
  to: RegistrationStatus;
  actor: EventActor;
  /** Shown to the player: rejection reason, what to change, or why they withdrew. */
  reason?: string | null;
  /** Extra note for the timeline only. */
  note?: string | null;
  /** The status the admin was looking at; if it has changed since, nothing happens (StaleStatusError). */
  expectFrom?: RegistrationStatus;
  /** Other fields written in the same update (e.g. a player's edited details). */
  data?: Prisma.RegistrationUpdateManyMutationInput;
}) {
  const { registrationId, to, actor } = params;
  const reason = params.reason?.trim() || null;

  return prisma.$transaction(async (tx) => {
    const current = await tx.registration.findUniqueOrThrow({
      where: { id: registrationId },
      select: { status: true, verifyToken: true },
    });
    const from = normalizeStatus(current.status);
    if (params.expectFrom && params.expectFrom !== from) throw new StaleStatusError();
    assertTransition(from, to, actor.type);

    const now = new Date();
    const reviewed = { reviewedAt: now, reviewedBy: actor.email ?? actor.type };
    const fields =
      to === "confirmed"
        ? {
            ...reviewed,
            rejectionReason: null,
            // The ID card's QR token; kept if it was confirmed before, so a printed card stays valid.
            ...(!current.verifyToken && { verifyToken: newVerifyToken() }),
          }
        : to === "rejected" || to === "changes_requested"
          ? { ...reviewed, rejectionReason: reason }
          : to === "withdrawn"
            ? { withdrawnAt: now, withdrawReason: reason }
            : { rejectionReason: null }; // back to pending

    const { count } = await tx.registration.updateMany({
      where: { id: registrationId, status: current.status },
      data: { ...params.data, status: to, ...fields },
    });
    if (count !== 1) throw new StaleStatusError();

    await recordRegistrationEvent(tx, {
      registrationId,
      type: eventTypeFor(to, actor.type),
      actor,
      note: [reason, params.note].filter(Boolean).join(" — ") || null,
    });

    return tx.registration.findUniqueOrThrow({
      where: { id: registrationId },
      include: { tournament: true },
    });
  }, TRANSACTION_TIMEOUTS);
}
