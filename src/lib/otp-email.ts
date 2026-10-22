import { deliver } from "@/lib/notify";
import { signInCodeEmail } from "@/lib/email/templates";

/** Sends the sign-in one-time code. Logs it instead when SES isn't configured outside production. */
export async function sendOtpEmail(params: { to: string; code: string }) {
  // No Reply-To: nobody should answer a code email.
  return deliver(params.to, signInCodeEmail({ code: params.code }), { replyTo: null });
}
