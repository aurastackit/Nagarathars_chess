"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Fields the organisers asked about (when a player updates their application):
 * the form's field components outline them and add a "Needs attention" note.
 * Outside an update form the set is empty and nothing changes.
 */
const AttentionContext = createContext<ReadonlySet<string>>(new Set());

export function AttentionProvider({ fields, children }: { fields: string[]; children: ReactNode }) {
  return <AttentionContext.Provider value={new Set(fields)}>{children}</AttentionContext.Provider>;
}

export function useNeedsAttention(field: string) {
  return useContext(AttentionContext).has(field);
}

export const ATTENTION_RING = "rounded-lg bg-amber-50 p-2 ring-2 ring-amber-400";

export function AttentionNote() {
  return (
    <p className="mb-1 text-xs font-semibold text-amber-800" data-attention>
      Needs attention — see the organisers&apos; note above
    </p>
  );
}
