import { CredentialsSignin } from "next-auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit-log";
import { checkRateLimit } from "@/lib/rate-limit";
import { WINDOW_MS, lockoutRemainingMs, type LoginAttempt } from "@/lib/login-throttle";

/** Thrown from authorize() when sign-in is locked; the login page reads `code`. */
export class LoginThrottled extends CredentialsSignin {
  code = "throttled";
}

/*
 * Sign-in attempts are stored as activity-log rows (auth.login_failed /
 * auth.login_success, actorEmail = the email typed, targetId = the client IP),
 * so the lockout holds across serverless instances and cold starts, and the
 * organisers can see failed attempts on the Activity page.
 */
export async function assertLoginAllowed(email: string, ip: string) {
  // Cheap per-instance guard first, so a flood never reaches the database.
  if (!checkRateLimit(`admin-login:${ip}`, 30, 15 * 60_000)) throw new LoginThrottled();

  const rows = await prisma.adminActivityLog.findMany({
    where: {
      action: { in: ["auth.login_failed", "auth.login_success"] },
      createdAt: { gt: new Date(Date.now() - WINDOW_MS) },
      OR: [{ actorEmail: email }, { targetId: ip }],
    },
    select: { action: true, actorEmail: true, targetId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const toAttempt = (r: (typeof rows)[number]): LoginAttempt => ({
    at: r.createdAt,
    ok: r.action === "auth.login_success",
  });
  const now = Date.now();
  const byEmail = rows.filter((r) => r.actorEmail === email).map(toAttempt);
  const byIp = rows.filter((r) => r.targetId === ip).map(toAttempt);
  if (Math.max(lockoutRemainingMs(byEmail, now), lockoutRemainingMs(byIp, now)) > 0) {
    throw new LoginThrottled();
  }
}

export async function recordLoginAttempt(email: string, ip: string, ok: boolean) {
  await logAdminAction({
    actorEmail: email,
    action: ok ? "auth.login_success" : "auth.login_failed",
    targetType: "AdminLogin",
    targetId: ip,
    summary: ok ? `Signed in from ${ip}` : `Failed sign-in from ${ip}`,
  });
}
