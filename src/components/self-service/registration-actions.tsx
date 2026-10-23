"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";

const WITHDRAW_REASONS = [
  "I can't attend on the tournament date",
  "Registered by mistake",
  "Duplicate registration",
  "Health or family reasons",
];

/** Withdraw (with a reason and a confirmation), from the player's own page. */
export function WithdrawButton({
  registrationId,
  playerName,
  presetReason,
  label = "Withdraw",
}: {
  registrationId: string;
  playerName: string;
  presetReason?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(presetReason ?? "");
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/my-registrations/${registrationId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Couldn't withdraw. Please try again.");
        if (body?.signIn) router.refresh();
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-red-700"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      {open && (
        <Modal title={`Withdraw ${playerName}?`} onClose={() => setOpen(false)} wide>
          <form onSubmit={submit} className="space-y-4 text-sm">
            <p className="text-foreground/75">
              The seat is released for someone else. This can&apos;t be undone — to play after
              withdrawing you&apos;d need to register again, if places are left.
            </p>
            <p lang="ta" className="text-xs text-foreground/60">
              விலகினால் உங்கள் இடம் வேறொருவருக்கு வழங்கப்படும்; இதை மாற்ற முடியாது.
            </p>
            <div>
              <label htmlFor="withdraw-reason" className="block font-medium text-charcoal">
                Why are you withdrawing?
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WITHDRAW_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground/80 hover:border-charcoal"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                id="withdraw-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={300}
                required
                className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal"
              />
            </div>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="mt-0.5 size-4 flex-none accent-[var(--charcoal)]"
              />
              <span>I understand the seat will be released and this can&apos;t be undone.</span>
            </label>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="dark"
                disabled={busy || !understood || reason.trim().length < 3}
                className="flex-1 bg-red-700 hover:bg-red-800"
              >
                {busy ? "Withdrawing…" : "Withdraw"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Keep my registration
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/** "Yes, I'll be there" for a changed tournament date. */
export function ConfirmDateButton({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/my-registrations/${registrationId}/date`, {
            method: "POST",
          });
          const body = await res.json().catch(() => null);
          setBusy(false);
          if (!res.ok) {
            setError(body?.error ?? "Couldn't save that. Please try again.");
            return;
          }
          router.refresh();
        }}
      >
        {busy ? "Saving…" : "Yes, I'll be there"}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
