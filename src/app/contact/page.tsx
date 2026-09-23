import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about a tournament or class? Send us a message and we'll get back to you.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-charcoal">Contact Us</h1>
      <p className="mt-2 text-foreground/60">
        Questions about a tournament or class? Send us a message and we&apos;ll get back to you.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </main>
  );
}
