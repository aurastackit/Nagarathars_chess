/**
 * Runs once when a server instance starts. Email config is checked here so a
 * missing variable is in the logs at startup, not first discovered when a
 * registrant's confirmation email fails. (The Amplify build also stops if any
 * SES variable is missing — see amplify.yml.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // On Amplify the variables only exist once env-runtime has run.
  await import("./lib/env-runtime");
  const { missingSesVars } = await import("./lib/ses");
  const missing = missingSesVars();
  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    console.error(
      `[startup] EMAIL IS NOT CONFIGURED: missing ${missing.join(", ")}. ` +
        "Registration, sign-in code and waitlist emails will fail until these are set."
    );
  }
}
