import "./env-runtime";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { assertLoginAllowed, recordLoginAttempt } from "@/lib/admin-login-guard";
import { credentialVersion, recordLogout } from "@/lib/admin-session";
import { getClientIp } from "@/lib/rate-limit";
import { ADMIN_SESSION_MAX_AGE_S, type AdminSessionClaims } from "@/lib/session-policy";

declare module "next-auth" {
  interface Session {
    loginAt?: AdminSessionClaims["loginAt"];
    sv?: AdminSessionClaims["sv"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: ADMIN_SESSION_MAX_AGE_S },
  pages: { signIn: "/admin/login" },
  callbacks: {
    // Stamp the sign-in time and credential version; requireAdmin checks both.
    jwt({ token, user }) {
      if (user) {
        token.loginAt = Date.now();
        token.sv = credentialVersion();
      }
      return token;
    },
    session({ session, token }) {
      session.loginAt = typeof token.loginAt === "number" ? token.loginAt : undefined;
      session.sv = typeof token.sv === "string" ? token.sv : undefined;
      return session;
    },
  },
  events: {
    async signOut(message) {
      const email = "token" in message ? message.token?.email : null;
      if (email) await recordLogout(email);
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        // Checked here rather than in the login page's action, because
        // /api/auth/callback/credentials reaches authorize() directly too.
        const attemptedEmail = email.trim().toLowerCase().slice(0, 254);
        const ip = getClientIp(request);
        await assertLoginAllowed(attemptedEmail, ip);

        const ok = email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
        await recordLoginAttempt(attemptedEmail, ip, ok);
        return ok ? { id: "admin", email, name: "Admin" } : null;
      },
    }),
  ],
});
