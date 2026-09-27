import { isSesConfigured, sendEmail } from "@/lib/ses";

/** Sends the login one-time code via Amazon SES. Falls back to a console.log stub when SES isn't configured. */
export async function sendOtpEmail(params: { to: string; code: string }) {
  const subject = "Your sign-in code";

  if (!isSesConfigured()) {
    console.log(`[otp-email:stub] Would email ${params.to} — code ${params.code}`);
    return { status: "stubbed" as const };
  }

  const html = `
    <p>Your sign-in code is <strong>${params.code}</strong>.</p>
    <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
  `;

  return sendEmail({ to: params.to, subject, html });
}
