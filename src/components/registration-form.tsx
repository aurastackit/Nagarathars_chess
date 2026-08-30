"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label } from "@/components/ui";

export function RegistrationForm({ tournamentSlug }: { tournamentSlug: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const res = await fetch(`/api/tournaments/${tournamentSlug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
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
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        You&apos;re registered! We&apos;ll be in touch with more details before the tournament.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" name="dob" type="date" />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Input id="gender" name="gender" placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="Optional" />
        </div>
      </div>
      <div>
        <Label htmlFor="fideId">FIDE ID</Label>
        <Input id="fideId" name="fideId" placeholder="Optional — leave blank if unrated" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "submitting"} className="w-full sm:w-auto">
        {status === "submitting" ? "Registering…" : "Register for this tournament"}
      </Button>
    </form>
  );
}
