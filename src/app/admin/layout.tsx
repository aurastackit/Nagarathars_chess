import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { getAdminSession } from "@/lib/require-admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { isReadOnly } from "@/lib/read-only";

// Admin pages are per-request (session, live data), never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Compact admin header; the public header, announcement bar and footer are hidden here (PublicOnly). */
function AdminHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="bg-charcoal text-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-3 pb-2">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/brand/lockup-compact-dark.svg"
            alt="Nagarathar's Chess Championship"
            width={115}
            height={30}
            unoptimized
            className="h-[30px] w-[115px] object-contain"
          />
          <span className="rounded bg-gold px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-charcoal">
            Admin
          </span>
        </Link>
        {children}
      </div>
    </header>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    // The proxy (src/proxy.ts) already redirects unauthenticated requests away
    // from every /admin/** route except /admin/login — this branch only ever
    // renders for the login page itself, which has no nav.
    return (
      <>
        <AdminHeader />
        <div className="flex-1">{children}</div>
      </>
    );
  }

  return (
    <>
      <AdminHeader>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="whitespace-nowrap text-background/70 hover:text-background">
            View site ↗
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="whitespace-nowrap font-medium text-background/70 hover:text-background"
            >
              Sign out
            </button>
          </form>
        </div>
        <div className="w-full pb-1">
          <AdminNav />
        </div>
      </AdminHeader>
      {isReadOnly() && (
        <div
          role="status"
          className="bg-warning px-4 py-2 text-center text-sm font-semibold text-white"
        >
          Read-only mode: the database is being moved. You can look around, but changes are disabled
          until it&apos;s switched off.
        </div>
      )}
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </>
  );
}
