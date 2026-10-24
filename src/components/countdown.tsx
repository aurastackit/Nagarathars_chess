"use client";

import { useEffect, useState } from "react";
import { getTimeLeft, type TimeLeft } from "@/lib/countdown-format";
import { endOfDayIST } from "@/lib/datetime";

export function Countdown({
  target,
  initialTimeLeft,
  compact = false,
  boxes = false,
}: {
  target: string;
  /**
   * Computed server-side from the same `now` used to render this HTML —
   * see AnnouncementBar for why: the client's first render must match the
   * server's exactly, or React logs a hydration mismatch. Live ticking
   * (necessarily using the client's own clock) only starts after mount.
   */
  initialTimeLeft: TimeLeft;
  /** Single-line "3d 11h left" form for tight spaces (e.g. the hero tournament chip) instead of the 4-box grid. */
  compact?: boolean;
  /** Three small boxes — Days / Hrs / Min — with labels underneath, for the hero tournament card. */
  boxes?: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(initialTimeLeft);

  useEffect(() => {
    const targetDate = endOfDayIST(target).getTime();
    function update() {
      setTimeLeft(getTimeLeft(targetDate - Date.now()));
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (compact) {
    const parts = [
      timeLeft.d > 0 ? `${timeLeft.d}d` : null,
      timeLeft.d > 0 || timeLeft.h > 0 ? `${timeLeft.h}h` : null,
      `${timeLeft.m}m`,
    ].filter(Boolean);
    return (
      <span className="font-semibold tabular-nums">
        {parts.join(" ")} <span className="font-normal opacity-75">left</span>
      </span>
    );
  }

  if (boxes) {
    const three = [
      { label: "Days", value: timeLeft.d },
      { label: "Hrs", value: timeLeft.h },
      { label: "Min", value: timeLeft.m },
    ];
    return (
      <div className="grid grid-cols-3 gap-2">
        {three.map((u) => (
          <div key={u.label} className="text-center">
            <div className="rounded-md bg-charcoal py-1.5 font-display text-xl font-bold tabular-nums leading-none text-white">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {u.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.d },
    { label: "Hours", value: timeLeft.h },
    { label: "Min", value: timeLeft.m },
    { label: "Sec", value: timeLeft.s },
  ];

  return (
    <div className="flex gap-3">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex min-w-[60px] flex-col items-center rounded-lg bg-white/10 px-3 py-2"
        >
          <span className="text-xl font-bold tabular-nums sm:text-2xl">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-white/60">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
