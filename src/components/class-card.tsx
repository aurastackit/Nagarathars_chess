"use client";

import { useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { EnrollmentForm } from "@/components/enrollment-form";

export function ClassCard({
  slug,
  title,
  level,
  description,
  scheduleText,
  instructorName,
  isOnline,
}: {
  slug: string;
  title: string;
  level: string;
  description: string;
  scheduleText: string;
  instructorName: string;
  isOnline: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="flex flex-col p-5">
      <div className="flex flex-wrap gap-2">
        <Badge tone="orange">{level}</Badge>
        <Badge tone="gray">{isOnline ? "Online" : "In-person"}</Badge>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-foreground/70">{description}</p>
      <p className="mt-3 text-sm text-foreground/50">
        <span className="font-medium text-foreground/70">Schedule:</span> {scheduleText}
      </p>
      <p className="mt-1 text-sm text-foreground/50">
        <span className="font-medium text-foreground/70">Coach:</span> {instructorName}
      </p>
      <div className="mt-4">
        {open ? (
          <EnrollmentForm classSlug={slug} />
        ) : (
          <Button onClick={() => setOpen(true)} className="w-full">
            Enroll interest
          </Button>
        )}
      </div>
    </Card>
  );
}
