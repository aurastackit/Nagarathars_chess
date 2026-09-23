import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-14 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-gold-ink">404</p>
      <h1 className="mt-2 text-3xl font-bold text-charcoal">Page not found</h1>
      <p className="mt-3 text-foreground/60">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <LinkButton href="/">Back to home</LinkButton>
        <LinkButton href="/tournaments" variant="outline">
          View tournaments
        </LinkButton>
      </div>
    </main>
  );
}
