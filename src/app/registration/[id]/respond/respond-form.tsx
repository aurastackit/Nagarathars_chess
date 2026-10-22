"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import type { RespondResult } from "./actions";

export function RespondForm({
  id,
  a,
  e,
  t,
  withdraw,
  action,
}: {
  id: string;
  a: string;
  e: string;
  t: string;
  withdraw: boolean;
  action: (state: RespondResult, formData: FormData) => Promise<RespondResult>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  if (state?.ok) {
    return (
      <p role="status" className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
        {state.message}
      </p>
    );
  }
  return (
    <form action={formAction} className="mt-6 space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="a" value={a} />
      <input type="hidden" name="e" value={e} />
      <input type="hidden" name="t" value={t} />
      <p className="text-sm text-foreground/75">
        {withdraw
          ? "If you can't make the new date, withdraw below. Your seat goes to someone else, and you'll get an email confirming it."
          : "Please confirm you'll play on the new date."}
      </p>
      <Button type="submit" disabled={pending} variant={withdraw ? "dark" : "primary"}>
        {pending ? "Saving…" : withdraw ? "Withdraw my registration" : "Yes, I'll be there"}
      </Button>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
