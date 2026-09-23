"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label } from "@/components/ui";

export function ClassWaitlistForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/classes/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
        <p className="font-semibold text-charcoal">You&apos;re on the list!</p>
        <p className="mt-1 text-sm text-foreground/60">We&apos;ll email you the moment classes open up.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
      <p className="font-semibold text-charcoal">No classes open right now</p>
      <p className="mt-1 text-sm text-foreground/60">Leave your details and we&apos;ll notify you the moment new classes are published.</p>
      <div className="mx-auto mt-4 grid max-w-sm gap-3 text-left sm:grid-cols-2">
        <div>
          <Label htmlFor="waitlist-email">Email</Label>
          <Input id="waitlist-email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="waitlist-phone">Phone (optional)</Label>
          <Input id="waitlist-phone" name="phone" type="tel" />
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "submitting"} className="mt-4">
        {status === "submitting" ? "Joining…" : "Get notified"}
      </Button>
    </form>
  );
}
