import { YouTubeIcon } from "@/components/icons/misc";

/** An outline pill linking out to a video on YouTube (new tab). Full width under 400px. */
export function YouTubeLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-charcoal px-5 py-2.5 text-center text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-background max-[399px]:w-full ${className}`}
    >
      <YouTubeIcon className="h-5 w-5 flex-none" aria-hidden="true" />
      <span>
        {children}
        <span className="sr-only"> (opens YouTube in a new tab)</span>
      </span>
    </a>
  );
}
