import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { credentialVersion, lastLogoutAt } from "@/lib/admin-session";
import { isSessionCurrent } from "@/lib/session-policy";

/**
 * The signed-in admin session, or null. Beyond a valid cookie signature this
 * checks the session is under 12 h old, was issued with the current admin
 * credentials, and wasn't followed by a sign-out — so a copied cookie stops
 * working once the admin signs out or the password is changed.
 */
export async function getAdminSession() {
  const session = await auth();
  const email = session?.user?.email;
  if (!session || !email) return null;
  const current = isSessionCurrent(session, {
    now: Date.now(),
    version: credentialVersion(),
    lastLogoutAt: await lastLogoutAt(email),
  });
  return current ? session : null;
}

/**
 * Explicit server-side auth check for admin pages and server actions.
 * The proxy (src/proxy.ts) already gates `/admin/**`, but this is
 * called directly in every page/action too — defense-in-depth, and the only
 * thing that actually protects a server action once it's invoked (the proxy
 * matches the action's own POST path, not the page it was rendered from).
 */
export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/** Same, for API route handlers — returns null instead of redirecting so the caller can respond with 401 JSON. */
export async function requireAdminApi() {
  return getAdminSession();
}
