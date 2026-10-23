import "server-only";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit-log";
import { deliver, organisersEmail } from "@/lib/notify";
import { registrationErrorAlertEmail } from "@/lib/email/templates";

const ALERT_ACTION = "alert.registration";
const WINDOW_MS = 60 * 60 * 1000;

/**
 * The register API failed in a way the player can't fix (the server rejected
 * the form's data, the tournament is missing, or an error). Logs it, and emails
 * the organisers — at most once an hour, tracked in the admin activity log so
 * it holds across server instances. Never throws: the player still gets the
 * original error response.
 */
export async function alertRegistrationFailure(p: { status: number; error: string; slug: string }) {
  console.error(`[register] unexpected ${p.status} for ${p.slug}: ${p.error}`);
  try {
    const recent = await prisma.adminActivityLog.findFirst({
      where: { action: ALERT_ACTION, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
      select: { id: true },
    });
    if (recent) return "throttled" as const;

    const to = organisersEmail();
    const tournament = await prisma.tournament.findUnique({
      where: { slug: p.slug },
      select: { title: true },
    });
    let sent = false;
    if (to) {
      try {
        await deliver(
          to,
          registrationErrorAlertEmail({
            status: p.status,
            error: p.error.slice(0, 300),
            tournament: tournament?.title ?? p.slug,
            at: new Date(),
          }),
          { replyTo: null }
        );
        sent = true;
      } catch (err) {
        console.error("[register] alert email failed:", err);
      }
    }
    await logAdminAction({
      actorEmail: "system",
      action: ALERT_ACTION,
      targetType: "Tournament",
      targetId: p.slug,
      summary: `Registration failed (${p.status}): ${p.error.slice(0, 200)} — ${sent ? "organisers emailed" : to ? "alert email failed" : "ORGANISERS_EMAIL not set, nobody emailed"}`,
    });
    return sent ? ("sent" as const) : ("not-sent" as const);
  } catch (err) {
    console.error("[register] could not raise the alert:", err);
    return "error" as const;
  }
}
