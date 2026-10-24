import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/contact-form";
import { CLASSES_ENABLED } from "@/lib/features";
import { Card } from "@/components/ui";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_GREETING } from "@/data/contact";

export const metadata: Metadata = pageMetadata({
  title: "Contact the Organisers",
  description: CLASSES_ENABLED
    ? "Questions about a chess tournament, registration or online class in Chennai? Send the Nagarathar's Chess Championship team a message and we'll reply soon."
    : "Questions about a chess tournament, registration or our upcoming online classes in Chennai? Send the Nagarathar's Chess Championship team a message.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="h1 text-charcoal">Contact Us</h1>
      <p className="text-body mt-2 text-muted">
        {CLASSES_ENABLED
          ? "Questions about a tournament or class? Send us a message and we'll get back to you."
          : "Questions about a tournament? Send us a message and we'll get back to you."}
      </p>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ContactForm />
        <Card className="p-6">
          <h2 className="h3 text-charcoal">Reach us directly</h2>
          <WhatsAppButton text={WHATSAPP_GREETING} className="mt-4 w-full" />
          <p className="mt-2 text-center text-sm tabular-nums text-muted">{WHATSAPP_DISPLAY}</p>
          <div className="mt-5 border-t border-border pt-4 text-sm">
            <p className="text-muted">Email</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="break-all font-semibold text-charcoal underline-offset-2 hover:text-gold-ink hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">We usually reply within a day.</p>
        </Card>
      </div>
    </main>
  );
}
