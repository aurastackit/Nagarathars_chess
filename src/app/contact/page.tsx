import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = pageMetadata({
  title: "Contact the Organisers",
  description:
    "Questions about a chess tournament, registration or online class in Chennai? Send the Nagarathar's Chess Championship team a message and we'll reply soon.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="h1 text-charcoal">Contact Us</h1>
      <p className="text-body mt-2 text-muted">
        Questions about a tournament or class? Send us a message and we&apos;ll get back to you.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </main>
  );
}
