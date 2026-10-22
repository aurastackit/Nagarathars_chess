import "./env-runtime";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { assertLoginAllowed, recordLoginAttempt } from "@/lib/admin-login-guard";
import { getClientIp } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
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
