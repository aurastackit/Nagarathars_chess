"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui";

export function EnrollmentForm({ classSlug }: { classSlug: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const res = await fetch(`/api/classes/${classSlug}/enroll`, {
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
      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        Thanks! We&apos;ll reach out about this class shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor={`${classSlug}-fullName`}>Full name</Label>
        <Input id={`${classSlug}-fullName`} name="fullName" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${classSlug}-email`}>Email</Label>
          <Input id={`${classSlug}-email`} name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor={`${classSlug}-phone`}>Phone</Label>
          <Input id={`${classSlug}-phone`} name="phone" type="tel" required />
        </div>
      </div>
      <div>
        <Label htmlFor={`${classSlug}-message`}>Message</Label>
        <Textarea id={`${classSlug}-message`} name="message" rows={2} placeholder="Optional" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Sending…" : "Enroll interest"}
      </Button>
    </form>
  );
}
