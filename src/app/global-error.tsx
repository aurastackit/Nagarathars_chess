"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

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
          <h1 className="h1 mt-2 text-charcoal">Something went wrong</h1>
          <p className="text-body mt-3 text-muted">
            The site hit an unexpected error. Please try again.
          </p>
          <Button onClick={reset} className="mt-6">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
