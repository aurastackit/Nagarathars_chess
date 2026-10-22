"use server";

import { requireAdminPage } from "@/lib/require-admin";
import { deliver } from "@/lib/notify";
import { logAdminAction } from "@/lib/audit-log";
import { emailSamples, sampleRegistration, type SampleKey } from "@/lib/email/samples";
import { buildTournamentIcs } from "@/lib/ics";
import { eventLine } from "@/lib/id-card/layout";
import { renderIdCardPdf } from "@/lib/id-card/pdf";
import { SITE_URL } from "@/lib/site";
import type { EmailAttachment } from "@/lib/ses";

export type TestSendResult = { ok: boolean; message: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The sample versions of what the approval email attaches. */
async function sampleAttachments(now: Date): Promise<EmailAttachment[]> {
  const r = sampleRegistration(now);
  const pdf = await renderIdCardPdf({
    registrationNo: r.registrationNo!,
    fullName: r.fullName,
    category: "under_11",
    gender: "female",
    birthYear: r.tournament.startDate.getUTCFullYear() - 9,
    native: "Karaikudi",
    mobileMasked: "••••••0042",
    eventLine: eventLine(r.tournament.startDate, r.tournament.endDate, r.tournament.city),
    photo: null,
    verifyUrl: `${SITE_URL}/verify/sample-token-0000`,
  });
  return [
    {
      filename: "NCC26-U11-0042-id-card.pdf",
      contentBase64: pdf.toString("base64"),
      contentType: "application/pdf",
    },
    {
      filename: "sample-tournament.ics",
      contentBase64: Buffer.from(
        buildTournamentIcs({
          ...r.tournament,
          slug: "sample-tournament",
          description: "Sample tournament (test email).",
        })
      ).toString("base64"),
      contentType: "text/calendar",
    },
  ];
}

/** Sends sample versions of the chosen templates (subject starts with "[Test]") to one address. */
export async function sendTestEmails(
  _state: TestSendResult,
  formData: FormData
): Promise<TestSendResult> {
  const session = await requireAdminPage();
  const to = String(formData.get("to") ?? "").trim();
  if (!EMAIL.test(to))
    return { ok: false, message: "Enter the email address to send the test to." };
  const keys = formData.getAll("key").map(String) as SampleKey[];
  const now = new Date();
  const samples = emailSamples(now).filter((s) => keys.includes(s.key));
  if (samples.length === 0) return { ok: false, message: "Choose a template to send." };

  const sent: string[] = [];
  const failed: string[] = [];
  for (const s of samples) {
    try {
      await deliver(
        to,
        { ...s.content, subject: `[Test] ${s.content.subject}` },
        {
          attachments: s.key === "approved" ? await sampleAttachments(now) : undefined,
          replyTo:
            s.key === "contact" ? "parent@example.com" : s.key === "sign_in" ? null : undefined,
        }
      );
      sent.push(s.title);
    } catch (err) {
      console.error(`[email-test] ${s.key} failed:`, err);
      failed.push(`${s.title} (${err instanceof Error ? err.message : "failed"})`);
    }
  }
  await logAdminAction({
    actorEmail: session.user!.email!,
    action: "email.test",
    targetType: "Email",
    targetId: to,
    summary: `Sent ${sent.length} test email(s) to ${to}${failed.length ? `; ${failed.length} failed` : ""}`,
  });
  return {
    ok: failed.length === 0,
    message:
      `Sent ${sent.length} test email${sent.length === 1 ? "" : "s"} to ${to}.` +
      (failed.length ? ` Failed: ${failed.join("; ")}.` : ""),
  };
}
