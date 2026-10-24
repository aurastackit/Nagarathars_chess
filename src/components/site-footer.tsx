import Image from "next/image";
import Link from "next/link";
import { CLASSES_ENABLED } from "@/lib/features";
import { WhatsAppIcon } from "@/components/icons/misc";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_GREETING, whatsappLink } from "@/data/contact";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/classes", label: "Online Classes" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/my-registration", label: "My registration" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-charcoal text-sm text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <Image
            src="/brand/lockup-horizontal-dark.svg"
            alt="Nagarathar's Chess Championship"
            width={176}
            height={52}
            unoptimized
            className="h-[52px] w-[176px]"
          />
          <p className="mt-3 text-white/60">Think Ahead, Win Ahead.</p>
          <p className="mt-4 max-w-xs text-white/60">
            {CLASSES_ENABLED
              ? "A community-driven initiative bringing chess tournaments and online coaching to local, non-rated players — open to every age group, at no cost to get started."
              : "A community-driven initiative bringing chess tournaments (and, soon, online coaching) to local, non-rated players — open to every age group, at no cost to get started."}
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Quick links</p>
          <ul className="mt-3 space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Get in touch</p>
          <p className="mt-3 text-white/60">
            {CLASSES_ENABLED
              ? "Have a question about a tournament, class, or how to get involved?"
              : "Have a question about a tournament or how to get involved?"}
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-block font-semibold text-gold hover:underline"
          >
            Send us a message &rarr;
          </Link>
          <a
            href={whatsappLink(WHATSAPP_GREETING)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 transition-colors hover:text-white hover:underline"
          >
            <WhatsAppIcon className="h-4 w-4 flex-none" aria-hidden="true" />
            <span>
              WhatsApp {WHATSAPP_DISPLAY}
              <span className="sr-only"> (opens in a new tab)</span>
            </span>
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-2 block break-all transition-colors hover:text-white hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 text-xs">
          <p className="text-white/50">
            &copy; {new Date().getFullYear()} Nagarathar&apos;s Chess Championship.
          </p>
          <Link href="/privacy" className="transition-colors hover:text-white hover:underline">
            Privacy policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
