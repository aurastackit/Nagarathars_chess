import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit-log";

/**
 * Changes whenever ADMIN_EMAIL or ADMIN_PASSWORD changes, so rotating the
 * credentials signs out every existing session. Only a hash goes in the cookie.
 */
export function credentialVersion() {
  return createHash("sha256")
    .update(`${process.env.ADMIN_EMAIL ?? ""}\n${process.env.ADMIN_PASSWORD ?? ""}`)
    .digest("hex")
    .slice(0, 16);
}

/*
 * The time of the last sign-out, looked up per request by requireAdmin.
 * Cached for a few seconds per instance; the instance that handles the
 * sign-out updates its cache straight away.
 */
const CACHE_MS = 10_000;
const logoutCache = new Map<string, { at: number | null; fetchedAt: number }>();

export async function lastLogoutAt(email: string) {
  const cached = logoutCache.get(email);
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached.at;
  const row = await prisma.adminActivityLog.findFirst({
    where: { action: "auth.logout", actorEmail: email },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const at = row?.createdAt.getTime() ?? null;
  logoutCache.set(email, { at, fetchedAt: Date.now() });
  return at;
}

/** Signing out ends every session for this admin, including ones copied elsewhere. */
export async function recordLogout(email: string) {
  await logAdminAction({
    actorEmail: email,
    action: "auth.logout",
    targetType: "AdminLogin",
    targetId: email,
    summary: "Signed out (all sessions ended)",
  });
  logoutCache.set(email, { at: Date.now(), fetchedAt: Date.now() });
}
