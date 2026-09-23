"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui";

export default function Error({
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
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-14 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold-ink">Error</p>
      <h1 className="mt-2 text-3xl font-bold text-charcoal">Something went wrong</h1>
      <p className="mt-3 text-foreground/60">
        We hit an unexpected error loading this page. You can try again or head back home.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="outline">
          Back to home
        </LinkButton>
      </div>
    </main>
  );
}
