"use client";

import { useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { ClassEnrollWizard } from "@/components/class-enroll-wizard";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ClassCard({
  slug,
  level,
  title,
  description,
  scheduleText,
  instructorName,
  isOnline,
  sessionType,
  price,
  maxGroupSize,
  durationMinutes,
}: {
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
}) {
  const [open, setOpen] = useState(false);
  const sessionLabel =
    sessionType === "group" ? `Group${maxGroupSize ? ` (max ${maxGroupSize})` : ""}` : "1-on-1";

  return (
    <Card className="flex flex-col p-5">
      <div className="flex flex-wrap gap-2">
        <Badge tone="gold-ink">{LEVEL_LABEL[level] ?? level}</Badge>
        <Badge tone="gray">{isOnline ? "Online" : "In-person"}</Badge>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground/70">{description}</p>
      <p className="mt-3 text-sm font-semibold text-gold-ink">
        ₹{price} &middot; {sessionLabel} &middot; {durationMinutes} min
      </p>
      <p className="mt-2 text-sm text-foreground/50">
        <span className="font-medium text-foreground/70">Schedule:</span> {scheduleText}
      </p>
      <p className="mt-1 text-sm text-foreground/50">
        <span className="font-medium text-foreground/70">Coach:</span> {instructorName}
      </p>
      {level !== "beginner" && (
        <p className="mt-1 text-xs text-foreground/50">FIDE rating required to enroll.</p>
      )}
      <div className="mt-4">
        {open ? (
          <ClassEnrollWizard classSlug={slug} level={level} />
        ) : (
          <Button onClick={() => setOpen(true)} className="w-full">
            Enroll interest
          </Button>
        )}
      </div>
    </Card>
  );
}
