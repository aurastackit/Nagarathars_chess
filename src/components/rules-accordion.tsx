"use client";

import { useState } from "react";
import type { RuleSection } from "@/lib/rules";

export function RulesAccordion({ sections }: { sections: RuleSection[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {sections.map((section, i) => {
        const open = openIndex === i;
        return (
          <div key={section.title + i}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
            >
              {section.title}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`h-4 w-4 flex-none text-foreground/50 transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {open && <p className="px-4 pb-4 text-sm text-foreground/70">{section.body}</p>}
          </div>
        );
      })}
    </div>
  );
}
