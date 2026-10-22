"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label } from "@/components/ui";
import { HoneypotField } from "@/components/honeypot-field";

const INTEREST_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "not_sure", label: "Not sure yet" },
];

export function ClassWaitlistForm({
  title = "No classes open right now",
  description = "Leave your details and we'll notify you the moment new classes are published.",
  successMessage,
  withInterest = false,
}: {
  /** Heading inside the card; null when the surrounding section already has one. */
  title?: string | null;
  description?: string | null;
  /** Replaces the default two-line confirmation with a single message. */
  successMessage?: string;
  /** Adds the optional "Interested in" level select. */
  withInterest?: boolean;
}) {
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
      <div
        role="status"
        className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center"
      >
        {successMessage ? (
          <p className="font-semibold text-charcoal">{successMessage}</p>
        ) : (
          <>
            <p className="font-semibold text-charcoal">You&apos;re on the list!</p>
            <p className="mt-1 text-sm text-muted">
              We&apos;ll email you the moment classes open up.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center"
    >
      <HoneypotField />
      {title && <p className="font-semibold text-charcoal">{title}</p>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div
        className={`mx-auto grid gap-3 text-left sm:grid-cols-2 ${title || description ? "mt-4" : ""} ${withInterest ? "max-w-xl" : "max-w-sm"}`}
      >
        <div>
          <Label htmlFor="waitlist-email">Email</Label>
          <Input id="waitlist-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="waitlist-phone">Phone (optional)</Label>
          <Input id="waitlist-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        {withInterest && (
          <div className="sm:col-span-2">
            <Label htmlFor="waitlist-interest">Interested in (optional)</Label>
            <select
              id="waitlist-interest"
              name="interestLevel"
              defaultValue=""
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-charcoal"
            >
              <option value="">Choose a level…</option>
              {INTEREST_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={status === "submitting"} className="mt-4">
        {status === "submitting" ? "Joining…" : "Get notified"}
      </Button>
    </form>
  );
}
