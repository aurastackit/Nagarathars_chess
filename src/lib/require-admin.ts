import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Explicit server-side auth check for admin pages and server actions.
 * The middleware (src/middleware.ts) already gates `/admin/**`, but this is
 * called directly in every page/action too — defense-in-depth, and the only
 * thing that actually protects a server action once it's invoked (middleware
 * matches the action's own POST path, not the page it was rendered from).
 */
export async function requireAdminPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin/login");
  }
  return session;
}

/** Same, for API route handlers — returns null instead of redirecting so the caller can respond with 401 JSON. */
export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return session;
}
