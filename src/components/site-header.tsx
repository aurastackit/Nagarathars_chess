import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/classes", label: "Online Classes" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="font-semibold text-navy leading-tight">
            Nagarathar&apos;s Chess
            <span className="block text-xs font-normal text-foreground/60">Championship</span>
          </span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-foreground/80 sm:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-navy">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/admin/login"
          className="rounded-md border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
        >
          Admin Login
        </Link>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 text-sm font-medium text-foreground/80 sm:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-navy">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
