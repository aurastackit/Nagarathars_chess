/** Hidden field name real users never fill in; bots that auto-fill every field do. */
export const HONEYPOT_FIELD = "company_website";

export function isHoneypotTriggered(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}
