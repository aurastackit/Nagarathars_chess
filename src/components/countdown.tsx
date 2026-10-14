"use client";

import { useEffect, useState } from "react";
import { getTimeLeft, type TimeLeft } from "@/lib/countdown-format";
import { endOfDayIST } from "@/lib/datetime";

export function Countdown({
  target,
  initialTimeLeft,
}: {
  target: string;
  /**
   * Computed server-side from the same `now` used to render this HTML —
   * see AnnouncementBar for why: the client's first render must match the
   * server's exactly, or React logs a hydration mismatch. Live ticking
   * (necessarily using the client's own clock) only starts after mount.
   */
  initialTimeLeft: TimeLeft;
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
