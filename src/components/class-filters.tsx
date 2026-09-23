"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui";
import { ClassCard } from "@/components/class-card";
import { ClassWaitlistForm } from "@/components/class-waitlist-form";

export type ClassCardData = {
  id: string;
  slug: string;
  level: string;
  title: string;
  description: string;
  scheduleText: string;
  instructorName: string;
  isOnline: boolean;
  sessionType: string;
  price: number;
  maxGroupSize: number | null;
  durationMinutes: number;
};

export function ClassFilters({ classes }: { classes: ClassCardData[] }) {
  const [level, setLevel] = useState("all");
  const [mode, setMode] = useState("all");

  const filtered = useMemo(() => {
    return classes
      .filter((c) => level === "all" || c.level === level)
      .filter((c) => mode === "all" || c.sessionType === mode);
  }, [classes, level, mode]);

  if (classes.length === 0) {
    return <ClassWaitlistForm />;
  }

  return (
    <div>
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="class-filter-level"
            className="mb-1 block text-xs font-medium text-foreground/60"
          >
            Level
          </label>
          <Select id="class-filter-level" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </div>
        <div>
          <label
            htmlFor="class-filter-mode"
            className="mb-1 block text-xs font-medium text-foreground/60"
          >
            Mode
          </label>
          <Select id="class-filter-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="all">Group &amp; 1-on-1</option>
            <option value="group">Group</option>
            <option value="individual">1-on-1</option>
          </Select>
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground/50">
        {filtered.length} class{filtered.length === 1 ? "" : "es"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 text-foreground/60">
          No classes match these filters — try widening your search.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ClassCard
              key={c.id}
              slug={c.slug}
              level={c.level}
              title={c.title}
              description={c.description}
              scheduleText={c.scheduleText}
              instructorName={c.instructorName}
              isOnline={c.isOnline}
              sessionType={c.sessionType}
              price={c.price}
              maxGroupSize={c.maxGroupSize}
              durationMinutes={c.durationMinutes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
