"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { AGE_CATEGORIES } from "@/lib/age-category";
import { KOVILS } from "@/lib/kovils";

export function RegistrationForm({ tournamentSlug }: { tournamentSlug: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [kovilLabel, setKovilLabel] = useState("");
  const selectedKovil = KOVILS.find((k) => k.label === kovilLabel);
  const pirivuOptions = selectedKovil?.pirivus ?? [];

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
      setKovilLabel("");
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
          <Select id="gender" name="gender" defaultValue="">
            <option value="">Optional</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="Optional" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rating">Rating</Label>
          <Input id="rating" name="rating" type="number" min={0} placeholder="Optional — local/state rating" />
        </div>
        <div>
          <Label htmlFor="fideId">FIDE ID</Label>
          <Input id="fideId" name="fideId" placeholder="Optional — leave blank if unrated" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="kovil">Kovil</Label>
          <Select
            id="kovil"
            name="kovil"
            value={kovilLabel}
            onChange={(e) => setKovilLabel(e.target.value)}
          >
            <option value="">Optional — select your Kovil</option>
            {KOVILS.map((k) => (
              <option key={k.value} value={k.label}>
                {k.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="pirivu">Pirivu</Label>
          {!kovilLabel ? (
            <Select id="pirivu" name="pirivu" disabled defaultValue="">
              <option value="">Select Kovil first</option>
            </Select>
          ) : pirivuOptions.length === 0 ? (
            <Select id="pirivu" name="pirivu" disabled defaultValue="">
              <option value="">NA</option>
            </Select>
          ) : (
            <Select key={kovilLabel} id="pirivu" name="pirivu" defaultValue="">
              <option value="">Optional — select your Pirivu</option>
              {pirivuOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="ageCategory">Age category</Label>
        <Select id="ageCategory" name="ageCategory" required defaultValue="">
          <option value="" disabled>
            Select your age category
          </option>
          {AGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-foreground/50">
          You can play up in an older category if you&apos;d like, but not down.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "submitting"} className="w-full sm:w-auto">
        {status === "submitting" ? "Registering…" : "Register for this tournament"}
      </Button>
    </form>
  );
}
