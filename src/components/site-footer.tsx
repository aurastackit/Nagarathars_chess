import Link from "next/link";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/classes", label: "Online Classes" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-charcoal text-sm text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-white">Nagarathar&apos;s Chess Championship</p>
          <p className="mt-1 text-white/60">Think Ahead, Win Ahead.</p>
          <p className="mt-4 max-w-xs text-white/60">
            A community-driven initiative bringing chess tournaments and online coaching to local,
            non-rated players — open to every age group, at no cost to get started.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Quick links</p>
          <ul className="mt-3 space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Get in touch</p>
          <p className="mt-3 text-white/60">
            Have a question about a tournament, class, or how to get involved?
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-block font-semibold text-gold hover:underline"
          >
            Send us a message &rarr;
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <p className="mx-auto max-w-6xl px-4 text-xs text-white/50">
          &copy; {new Date().getFullYear()} Nagarathar&apos;s Chess Championship.
        </p>
      </div>
    </footer>
  );
}
