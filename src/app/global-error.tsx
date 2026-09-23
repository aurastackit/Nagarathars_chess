"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-4 font-sans">
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-gold-ink">Error</p>
          <h1 className="mt-2 text-3xl font-bold text-charcoal">Something went wrong</h1>
          <p className="mt-3 text-foreground/60">
            The site hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-gold/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
