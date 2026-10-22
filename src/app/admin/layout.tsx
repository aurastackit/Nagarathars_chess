import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { getAdminSession } from "@/lib/require-admin";

// Admin pages are per-request (session, live data), never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    // Middleware (src/middleware.ts) already redirects unauthenticated
    // requests away from every /admin/** route except /admin/login — this
    // branch only ever renders for the login page itself, which has no nav.
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-4">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-foreground/80">
          <Link href="/admin" className="hover:text-charcoal">
            Dashboard
          </Link>
          <Link href="/admin/tournaments" className="hover:text-charcoal">
            Tournaments
          </Link>
          <Link href="/admin/classes" className="hover:text-charcoal">
            Classes
          </Link>
          <Link href="/admin/messages" className="hover:text-charcoal">
            Messages
          </Link>
          <Link href="/admin/waitlist" className="hover:text-charcoal">
            Waitlist
          </Link>
          <Link href="/admin/activity" className="hover:text-charcoal">
            Activity
          </Link>
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="whitespace-nowrap text-sm font-medium text-foreground/60 hover:text-charcoal"
          >
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
