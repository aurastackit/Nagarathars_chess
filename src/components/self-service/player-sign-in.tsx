"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sign in to /my-registration with a code emailed to the address used when registering. */
export function PlayerSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!EMAIL.test(email.trim())) {
      setError("Enter the email address you registered with.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), [HONEYPOT_FIELD]: "" }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Couldn't send the code. Please try again.");
        return;
      }
      setCode("");
      setStep("code");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "That code didn't work. Please try again.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-charcoal">Sign in to see your registrations</h2>
      <p className="mt-1 text-sm text-foreground/70">
        Use the email you registered with. Parents: you&apos;ll see every child registered with that
        email.
      </p>
      <p lang="ta" className="mt-1 text-xs text-foreground/60">
        பதிவு செய்த மின்னஞ்சலுக்கு வரும் 6 இலக்கக் குறியீட்டை உள்ளிட்டு, உங்கள் பதிவுகளைப்
        பார்க்கவும் மாற்றவும் முடியும்.
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-5 space-y-3" noValidate>
          <div>
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy ? "Sending…" : "Email me a code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-5 space-y-3" noValidate>
          <p className="text-sm text-foreground/75">
            We sent a 6-digit code to <strong>{email.trim()}</strong>. It expires in 10 minutes.
          </p>
          <div>
            <Label htmlFor="signin-code">6-digit code</Label>
            <Input
              id="signin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy || code.length !== 6}>
              {busy ? "Checking…" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={busy}
              className="text-sm text-foreground/60 underline disabled:opacity-40"
            >
              Send a new code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="text-sm text-foreground/60 underline"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Ends the self-service session on this browser. */
export function PlayerSignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/player/sign-out", { method: "POST" });
        router.refresh();
      }}
      className="text-sm font-medium text-foreground/60 underline hover:text-charcoal"
    >
      Sign out
    </button>
  );
}
