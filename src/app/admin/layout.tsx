import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    // Middleware (src/middleware.ts) already redirects unauthenticated
    // requests away from every /admin/** route except /admin/login — this
    // branch only ever renders for the login page itself, which has no nav.
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <nav className="flex gap-6 text-sm font-medium text-foreground/80">
          <Link href="/admin" className="hover:text-charcoal">
            Dashboard
          </Link>
          <Link href="/admin/tournaments" className="hover:text-charcoal">
            Tournaments
          </Link>
          <Link href="/admin/classes" className="hover:text-charcoal">
            Classes
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
          <button type="submit" className="text-sm font-medium text-foreground/60 hover:text-charcoal">
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
