export function VenueMap({ venue, city }: { venue: string; city: string }) {
  const query = encodeURIComponent(`${venue}, ${city}`);
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const embedSrc = `https://maps.google.com/maps?q=${query}&output=embed`;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <iframe
        title={`Map to ${venue}`}
        src={embedSrc}
        className="h-64 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{venue}</p>
          <p className="text-xs text-foreground/60">{city}</p>
        </div>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-charcoal px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background"
        >
          Get directions
        </a>
      </div>
    </div>
  );
}
