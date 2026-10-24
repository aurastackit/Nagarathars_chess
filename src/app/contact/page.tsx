import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/contact-form";
import { CLASSES_ENABLED } from "@/lib/features";
import { Card } from "@/components/ui";
import { WhatsAppIcon } from "@/components/icons/misc";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_GREETING } from "@/data/contact";

export const metadata: Metadata = pageMetadata({
  title: "Contact the Organisers",
  description: CLASSES_ENABLED
    ? "Questions about a chess tournament, registration or online class in Chennai? Send the Nagarathar's Chess Championship team a message and we'll reply soon."
    : "Questions about a chess tournament, registration or our upcoming online classes in Chennai? Send the Nagarathar's Chess Championship team a message.",
  path: "/contact",
});

// The address may wrap only before "@", never mid-word.
const [EMAIL_USER, EMAIL_DOMAIN] = CONTACT_EMAIL.split("@");

function MailIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

/** One "Reach us directly" row: gold icon, label, then the action. */
function ContactRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-gold/50 text-gold">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="h1 text-charcoal">Contact Us</h1>
      <p className="text-body mt-2 text-muted">
        {CLASSES_ENABLED
          ? "Questions about a tournament or class? Send us a message and we'll get back to you."
          : "Questions about a tournament? Send us a message and we'll get back to you."}
      </p>

      <Card className="mt-8 grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="p-6 sm:p-8">
          <h2 className="h3 text-charcoal">Send us a message</h2>
          <div className="mt-4">
            <ContactForm />
          </div>
        </div>

        {/* First on mobile, right column on desktop. */}
        <aside className="order-first space-y-6 bg-charcoal p-6 text-background sm:p-8 lg:order-last">
          <h2 className="h3 text-background">Reach us directly</h2>

          <ContactRow
            icon={<WhatsAppIcon className="h-5 w-5" aria-hidden="true" />}
            label="WhatsApp"
          >
            <p className="mt-1 font-semibold tabular-nums">{WHATSAPP_DISPLAY}</p>
            <WhatsAppButton
              text={WHATSAPP_GREETING}
              onDark
              className="mt-3 w-full sm:w-auto lg:w-full"
            />
          </ContactRow>

          <ContactRow icon={<MailIcon className="h-5 w-5" />} label="Email">
            <p className="mt-1 text-sm font-semibold [overflow-wrap:normal] [word-break:normal]">
              {EMAIL_USER}
              <wbr />@{EMAIL_DOMAIN}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 inline-block text-sm font-semibold text-gold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Write to us<span className="sr-only"> at {CONTACT_EMAIL}</span> &rarr;
            </a>
          </ContactRow>

          <p className="border-t border-background/15 pt-5 text-sm text-background/75">
            We usually reply within a day.
          </p>
        </aside>
      </Card>
    </main>
  );
}
