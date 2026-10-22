"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import type { ActionResult } from "@/app/admin/registrations/[id]/actions";

type Action = (state: ActionResult, formData: FormData) => Promise<ActionResult>;

function Result({ state }: { state: ActionResult }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={`text-sm ${state.ok ? "text-green-800" : "text-red-700"}`}>
      {state.message}
    </p>
  );
}

/** Internal notes: admins only, never shown to the player. */
export function AdminNotesForm({
  id,
  notes,
  action,
}: {
  id: string;
  notes: string | null;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="admin-notes" className="sr-only">
        Internal notes
      </label>
      <textarea
        id="admin-notes"
        name="notes"
        defaultValue={notes ?? ""}
        rows={4}
        maxLength={4000}
        placeholder="Only admins see this — e.g. who you spoke to and what was agreed."
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save notes"}
        </Button>
        <Result state={state} />
      </div>
    </form>
  );
}

/** Permanent delete, confirmed by typing the registration number. */
export function DeleteRegistrationForm({
  id,
  confirmText,
  action,
}: {
  id: string;
  confirmText: string;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [typed, setTyped] = useState("");
  return (
    <form action={formAction} className="space-y-2 text-sm">
      <input type="hidden" name="id" value={id} />
      <p className="text-foreground/70">
        Deletes this registration and its timeline for good, and frees its seat. Withdrawing keeps
        the record instead.
      </p>
      <label htmlFor="delete-confirm" className="block font-medium text-charcoal">
        Type <span className="font-mono">{confirmText}</span> to confirm
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="delete-confirm"
          name="confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="w-full max-w-[16rem] rounded-md border border-border bg-card px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
        />
        <Button
          type="submit"
          size="sm"
          variant="dark"
          disabled={pending || typed.trim().toUpperCase() !== confirmText.toUpperCase()}
          className="bg-red-700 hover:bg-red-800"
        >
          {pending ? "Deleting…" : "Delete registration"}
        </Button>
      </div>
      <Result state={state} />
    </form>
  );
}

/** The age proof stays hidden until asked for, so each look is a deliberate (and recorded) view. */
export function AgeProofPreview({ src, isPdf }: { src: string; isPdf: boolean }) {
  const [shown, setShown] = useState(false);
  if (isPdf) {
    return (
      <a href={src} target="_blank" rel="noopener" className="text-sm font-semibold underline">
        Open the PDF
      </a>
    );
  }
  return shown ? (
    // eslint-disable-next-line @next/next/no-img-element -- private document via a short-lived signed URL
    <img
      src={src}
      alt="Age proof"
      className="max-h-80 w-full rounded-md border border-border bg-background object-contain"
    />
  ) : (
    <Button type="button" size="sm" variant="outline" onClick={() => setShown(true)}>
      Show preview
    </Button>
  );
}
