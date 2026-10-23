"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import type { RetentionResult } from "@/app/admin/privacy/actions";

type Action = (state: RetentionResult, formData: FormData) => Promise<RetentionResult>;

/**
 * Runs the daily age-proof clean-up now, after a tick-box confirmation. With
 * nothing due it shows only the last result (e.g. right after deleting).
 */
export function RetentionRunForm({ count, action }: { count: number; action: Action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const result = state?.message ? (
    <p role="status" className={state.ok ? "text-green-800" : "text-red-700"}>
      {state.message}
    </p>
  ) : null;
  if (count === 0) return result && <div className="mt-3 text-sm">{result}</div>;
  return (
    <form action={formAction} className="mt-4 space-y-3 text-sm">
      <label className="flex items-start gap-2">
        <input type="checkbox" name="confirm" value="yes" className="mt-0.5" required />
        <span>
          Delete these {count} age proof(s) permanently. This can&apos;t be undone; the rest of each
          registration is kept.
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Deleting…" : "Delete now"}
        </Button>
        {result}
      </div>
    </form>
  );
}
