/** "Export CSV · Export Excel" download links (plain <a>: they're file downloads, not pages). */
export function ExportLinks({ csv, xlsx }: { csv: string; xlsx: string }) {
  const link = "text-sm font-semibold text-charcoal hover:underline";
  return (
    <div className="flex gap-4">
      <a href={csv} className={link}>
        Export CSV
      </a>
      <a href={xlsx} className={link}>
        Export Excel
      </a>
    </div>
  );
}
