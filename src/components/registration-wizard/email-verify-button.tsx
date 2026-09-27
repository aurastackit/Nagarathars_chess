"use client";

import { type FormEvent, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { RegistrationWizardValues } from "@/lib/registration-schema";
import { Button, Input, Label } from "@/components/ui";
import { Modal } from "@/components/modal";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sits next to the registration wizard's Email field. Sends and checks an
 * emailed one-time code via the same OTP endpoints used elsewhere, but never
 * creates a session — it only marks the email as verified so the register
 * API will accept the submission (see EMAIL_VERIFICATION_VALIDITY_MS).
 */
export function EmailVerifyButton({
  verifiedEmail,
  onVerified,
}: {
  verifiedEmail: string | null;
  onVerified: (email: string | null) => void;
}) {
  const { watch } = useFormContext<RegistrationWizardValues>();
  const email = (watch("email") ?? "").trim();
  const isValidEmail = EMAIL_REGEX.test(email);
  const isVerified = verifiedEmail !== null && verifiedEmail === email.toLowerCase();

  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, [HONEYPOT_FIELD]: "" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not send code. Please try again.");
        return;
      }
      setCode("");
      setModalOpen(true);
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Invalid or expired code");
        return;
      }
      onVerified(email.toLowerCase());
      setModalOpen(false);
    } finally {
      setVerifying(false);
    }
  }

  if (isVerified) {
    return (
      <span className="inline-flex flex-none items-center gap-1 text-sm font-medium text-green-700">
        ✓ Verified
      </span>
    );
  }

  return (
    <div className="flex flex-none flex-col items-start gap-1">
      <button
        type="button"
        disabled={!isValidEmail || sending}
        onClick={handleSendCode}
        className="inline-flex flex-none items-center rounded-md border border-charcoal px-3 py-2 text-xs font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending ? "Sending…" : "Verify"}
      </button>
      {!modalOpen && error && <p className="text-xs text-red-600">{error}</p>}

      {modalOpen && (
        <Modal title="Verify your email" onClose={() => setModalOpen(false)}>
          <p className="text-sm text-foreground/60">
            Enter the 6-digit code we sent to <strong>{email}</strong>.
          </p>
          <form onSubmit={handleVerifyCode} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="otp-code">6-digit code</Label>
              <Input
                id="otp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={verifying} className="w-full">
              {verifying ? "Verifying…" : "Verify"}
            </Button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sending}
              className="w-full text-center text-xs text-foreground/60 underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? "Resending…" : "Resend code"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
