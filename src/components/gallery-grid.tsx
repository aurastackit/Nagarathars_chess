"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { buttonClasses, Card } from "@/components/ui";
import { GALLERY_SECTION_LABEL, GALLERY_SECTION_ORDER } from "@/lib/gallery-sections";
import type { GallerySectionValue } from "@/lib/gallery-sections";
import type { ShortsItem } from "@/lib/video";
import { ShortsGrid } from "@/components/shorts-grid";

// "cover" for real photos (fills the frame, crops as needed); "contain" for
// poster/banner graphics, which must never be cropped. Defaults to "contain"
// since most existing callers are tournament/class poster images.
type RealItem = {
  id: string;
  src: string;
  title: string;
  caption: string;
  section?: GallerySectionValue;
  fit?: "cover" | "contain";
};

const INITIAL_COUNT = 12;
const PAGE_SIZE = 9;

export function GalleryGrid({
  realItems,
  videoItems = [],
}: {
  realItems: RealItem[];
  videoItems?: ShortsItem[];
}) {
  const sectionsPresent = GALLERY_SECTION_ORDER.filter(
    (section) =>
      realItems.some((item) => item.section === section) ||
      (section === "HIGHLIGHTS" && videoItems.length > 0)
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

      {activeSection === "HIGHLIGHTS" ? (
        <div className="mt-8">
          <ShortsGrid items={videoItems} />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((item, i) => (
              <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative h-48 w-full bg-background">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    // The first row is above the fold and is the page's LCP.
                    loading={i < 3 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={item.fit === "cover" ? "object-cover" : "object-contain"}
                  />
                </div>
                <div className="p-4">
                  <p className="h3 text-foreground">{item.title}</p>
                  <p className="text-small text-muted">{item.caption}</p>
                </div>
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
      )}
    </>
  );
}
