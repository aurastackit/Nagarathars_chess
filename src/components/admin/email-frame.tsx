"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { TestSendResult } from "@/app/admin/emails/preview/actions";

/**
 * An email's HTML in a sandboxed frame (no scripts), sized to its content —
 * the closest thing to how an inbox shows it.
 */
export function EmailFrame({ html, width, title }: { html: string; width: number; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      sandbox="allow-same-origin allow-popups"
      onLoad={() => {
        const doc = ref.current?.contentDocument;
        if (doc) setHeight(doc.documentElement.scrollHeight + 4);
      }}
      style={{ width, height }}
      className="max-w-full flex-none rounded-md border border-border bg-[#f6f1e7]"
    />
  );
}

type Send = (state: TestSendResult, formData: FormData) => Promise<TestSendResult>;

/** Sends sample versions of one or more templates to an address. */
export function TestSendForm({
  keys,
  label,
  action,
  compact = false,
}: {
  keys: string[];
  label: string;
  action: Send;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 text-sm">
      {keys.map((k) => (
        <input key={k} type="hidden" name="key" value={k} />
      ))}
      <label className="sr-only" htmlFor={`to-${keys.join("-")}`}>
        Send to
      </label>
      <input
        id={`to-${keys.join("-")}`}
        name="to"
        type="email"
        required
        placeholder="you@example.com"
        className={`${compact ? "w-56" : "w-72"} max-w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal`}
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Sending…" : label}
      </Button>
      {state?.message && (
        <span
          role="status"
          className={`w-full text-xs ${state.ok ? "text-green-800" : "text-red-700"}`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
