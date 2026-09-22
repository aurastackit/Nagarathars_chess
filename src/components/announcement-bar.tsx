"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClockIcon } from "@/components/icons/misc";

function formatCompact(diffMs: number): string | null {
  if (diffMs <= 0) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
}

export function AnnouncementBar({
  title,
  slug,
  registrationDeadline,
}: {
  title: string;
  slug: string;
  registrationDeadline: string;
}) {
  const target = new Date(registrationDeadline).getTime();
  const [label, setLabel] = useState<string | null>(() => formatCompact(target - Date.now()));

  useEffect(() => {
    function update() {
      setLabel(formatCompact(target - Date.now()));
    }
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [target]);

  if (!label) return null;

  return (
    <div className="bg-gold text-charcoal">
      <Link
        href={`/tournaments/${slug}`}
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
