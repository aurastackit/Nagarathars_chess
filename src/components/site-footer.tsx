export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-navy-dark py-8 text-sm text-white/70">
      <div className="mx-auto max-w-6xl px-4">
        <p className="font-semibold text-white">Nagarathar&apos;s Chess Championship</p>
        <p className="mt-1">Think Ahead, Win Ahead.</p>
        <p className="mt-4 text-xs text-white/50">
          &copy; {new Date().getFullYear()} Nagarathar&apos;s Chess Championship. Trial build.
        </p>
      </div>
    </footer>
  );
}
