"use client";

import { useEffect, useRef } from "react";
import type { UseFormWatch, UseFormReset, FieldValues } from "react-hook-form";

/** Debounced localStorage autosave + one-time restore for a react-hook-form instance. */
export function useDraftAutosave<T extends FieldValues>({
  storageKey,
  watch,
  reset,
  skipKeys = [],
}: {
  storageKey: string;
  watch: UseFormWatch<T>;
  reset: UseFormReset<T>;
  skipKeys?: string[];
}) {
  const restored = useRef(false);

  // Restore once, on mount.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, unknown>;
      reset((current) => ({ ...current, ...saved }));
    } catch {
      // Corrupt or unavailable storage — ignore and start fresh.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save on every change.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const subscription = watch((values) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        try {
          const toSave: Record<string, unknown> = { ...values };
          for (const key of skipKeys) delete toSave[key];
          window.localStorage.setItem(storageKey, JSON.stringify(toSave));
        } catch {
          // Storage full/unavailable — autosave is a convenience, not critical.
        }
      }, 400);
    });
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [watch, storageKey, skipKeys]);
}

export function clearDraft(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}
