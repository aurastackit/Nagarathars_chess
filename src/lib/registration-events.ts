import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RegistrationEventType =
  | "submitted"
  | "edited"
  | "confirmed"
  | "rejected"
  | "changes_requested"
  | "reopened"
  | "withdrawn"
  | "email_sent"
  | "email_failed"
  | "document_viewed"
  | "document_deleted"
  | "date_change_confirmed";

export type EventActor = { type: "player" | "admin" | "system"; email?: string | null };

type Db = Prisma.TransactionClient | PrismaClient;

/** Adds one entry to a registration's timeline. Pass the transaction client to keep it atomic with the change. */
export function recordRegistrationEvent(
  db: Db,
  event: {
    registrationId: string;
    type: RegistrationEventType;
    actor: EventActor;
    note?: string | null;
  }
) {
  return db.registrationEvent.create({
    data: {
      registrationId: event.registrationId,
      type: event.type,
      actorType: event.actor.type,
      actor: event.actor.email?.toLowerCase() ?? null,
      note: event.note ?? null,
    },
  });
}

/**
 * Sends an email about a registration and records email_sent or email_failed
 * on its timeline. Never throws: the action that triggered the email has
 * already happened, and a failed email shouldn't undo it or show an error page.
 */
export async function sendRegistrationEmail(
  registrationId: string,
  label: string,
  send: () => Promise<unknown>
) {
  let ok = true;
  let note = label;
  try {
    await send();
  } catch (err) {
    ok = false;
    note = `${label}: ${err instanceof Error ? err.message : String(err)}`.slice(0, 500);
    console.error(`[registration-email] ${label} failed for ${registrationId}:`, err);
  }
  try {
    await recordRegistrationEvent(prisma, {
      registrationId,
      type: ok ? "email_sent" : "email_failed",
      actor: { type: "system" },
      note,
    });
  } catch (err) {
    console.error("[registration-email] could not record the email event:", err);
  }
  return ok;
}
