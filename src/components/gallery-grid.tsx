"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { buttonClasses, Card } from "@/components/ui";
import { GALLERY_SECTION_LABEL, GALLERY_SECTION_ORDER } from "@/lib/gallery-sections";
import type { GallerySectionValue } from "@/lib/gallery-sections";

// "cover" for real photos (fills the frame, crops as needed); "contain" for
// poster/banner graphics, which must never be cropped. Defaults to "contain"
// since most existing callers are tournament/class poster images.
type RealItem = {
  id: string;
  src: string;
  /** Shown on the card when set; gallery photos pass their caption only. */
  title?: string | null;
  caption?: string;
  /** Defaults to the title. */
  alt?: string;
  section?: GallerySectionValue;
  fit?: "cover" | "contain";
};

const INITIAL_COUNT = 12;
const PAGE_SIZE = 9;

export function GalleryGrid({ realItems }: { realItems: RealItem[] }) {
  // Videos aren't in the grid (YouTube opens on YouTube), so no "Video Highlights" tab.
  const sectionsPresent = GALLERY_SECTION_ORDER.filter(
    (section) => section !== "HIGHLIGHTS" && realItems.some((item) => item.section === section)
  );
  const [activeSection, setActiveSection] = useState<GallerySectionValue | "ALL">("ALL");
  const [visible, setVisible] = useState(INITIAL_COUNT);

  const items = useMemo(
    () =>
      activeSection === "ALL"
        ? realItems
        : realItems.filter((item) => item.section === activeSection),
    [activeSection, realItems]
  );

  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;

  function selectSection(section: GallerySectionValue | "ALL") {
    setActiveSection(section);
    setVisible(INITIAL_COUNT);
  }

  return (
    <>
      {sectionsPresent.length > 1 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => selectSection("ALL")}
            className={buttonClasses(activeSection === "ALL" ? "primary" : "outline", "sm")}
          >
            All
          </button>
          {sectionsPresent.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => selectSection(section)}
              className={buttonClasses(activeSection === section ? "primary" : "outline", "sm")}
            >
              {GALLERY_SECTION_LABEL[section]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item, i) => (
          <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <div className="relative h-48 w-full bg-background">
              <Image
                src={item.src}
                alt={item.alt ?? item.title ?? ""}
                fill
                // The first photo is the page's LCP; the rest of the first row is
                // above the fold too, so eager — but not preloaded ahead of it.
                priority={i === 0}
                loading={i > 0 && i < 3 ? "eager" : undefined}
                fetchPriority={i > 0 && i < 3 ? "low" : undefined}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={item.fit === "cover" ? "object-cover" : "object-contain"}
              />
            </div>
            {(item.title || item.caption) && (
              <div className="p-4">
                {item.title && <p className="h3 text-foreground">{item.title}</p>}
                {item.caption && <p className="text-small text-muted">{item.caption}</p>}
              </div>
            )}
          </Card>
        ))}
      </div>
      {hasMore && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className={buttonClasses("outline")}
          >
            Load more ({items.length - visible} remaining)
          </button>
        </div>
      )}
    </>
  );
}
