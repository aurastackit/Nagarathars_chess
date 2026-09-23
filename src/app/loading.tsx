export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded bg-charcoal/10" />
        <div className="h-4 w-2/3 rounded bg-charcoal/10" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-charcoal/5" />
          ))}
        </div>
      </div>
    </main>
  );
}
