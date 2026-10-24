"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { HoneypotField } from "@/components/honeypot-field";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { contactWhatsappText } from "@/data/contact";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  // What was sent, so the success message can offer it on WhatsApp too.
  const [sentText, setSentText] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setSentText(
        contactWhatsappText({
          name: String(data.name ?? ""),
          email: String(data.email ?? ""),
          message: String(data.message ?? ""),
        })
      );
      setStatus("success");
      form.reset();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
      >
        <p className="font-semibold">
          Thank you — your message has been emailed to the organisers.
        </p>
        {sentText && (
          <>
            <WhatsAppButton text={sentText} className="mt-4">
              Also send on WhatsApp
            </WhatsAppButton>
            <p className="mt-2 text-green-900/80">
              WhatsApp opens with your message ready — just tap Send.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <HoneypotField />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
