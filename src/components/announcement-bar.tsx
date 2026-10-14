"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClockIcon } from "@/components/icons/misc";
import { formatCompact } from "@/lib/countdown-format";
import { endOfDayIST } from "@/lib/datetime";
import { registerPath } from "@/lib/registration-flow";

export function AnnouncementBar({
  title,
  slug,
  registrationDeadline,
  initialLabel,
}: {
  title: string;
  slug: string;
  registrationDeadline: string;
  /**
   * Computed server-side from the same `now` used to render this HTML, so
   * hydration's first client render matches exactly — the live ticking
   * value (which depends on the client's own `Date.now()`, necessarily
   * different from the server's) only kicks in after mount, in the effect
   * below. Without this, the server and client computed different label
   * strings for the same instant and React logged a hydration mismatch.
   */
  initialLabel: string | null;
}) {
  const [label, setLabel] = useState<string | null>(initialLabel);

  useEffect(() => {
    const target = endOfDayIST(registrationDeadline).getTime();
    function update() {
      setLabel(formatCompact(target - Date.now()));
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [registrationDeadline]);

  if (!label) return null;

  return (
    <div className="bg-gold text-charcoal">
      <Link
        href={registerPath(slug)}
        className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-semibold sm:text-sm"
      >
        <ClockIcon className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
        <span>
          Registration for {title} closes in {label}
        </span>
      </Link>
    </div>
  );
}
