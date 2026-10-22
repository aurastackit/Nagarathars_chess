"use client";

import { useRef, useState } from "react";
import { Button, buttonClasses } from "@/components/ui";

/**
 * A registration's ID card (the server-rendered PDF) with Download and Print.
 * Browsers that can't show a PDF inside a page (e.g. Chrome on Android) get a
 * link to open it instead.
 */
export function IdCardViewer({
  registrationId,
  title,
  className = "",
}: {
  registrationId: string;
  title: string;
  className?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [inline] = useState(() => navigator.pdfViewerEnabled !== false);
  const src = `/api/admin/id-cards/${registrationId}`;
  return (
    <div className={className}>
      <div className="relative mx-auto aspect-[54/86] w-full max-w-[17rem] overflow-hidden rounded-md border border-border bg-background">
        {inline ? (
          <>
            <p className="absolute inset-0 flex items-center justify-center text-xs text-foreground/50">
              Preparing the card…
            </p>
            <iframe
              ref={frame}
              src={`${src}#toolbar=0&navpanes=0&view=Fit`}
              title={title}
              className="relative block size-full"
            />
          </>
        ) : (
          <a
            href={src}
            target="_blank"
            rel="noopener"
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4 text-center text-sm font-medium text-charcoal underline"
          >
            Open the card
            <span className="text-xs font-normal text-foreground/60 no-underline">
              This browser can&apos;t preview PDFs here.
            </span>
          </a>
        )}
      </div>
      <div className="mx-auto mt-4 flex max-w-[17rem] gap-2">
        <a href={`${src}?download=1`} className={buttonClasses("primary", "sm", "flex-1")}>
          Download PDF
        </a>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => {
            // Print the PDF itself; otherwise open it in a new tab to print from there.
            try {
              if (!frame.current?.contentWindow) throw new Error("no inline viewer");
              frame.current.contentWindow.print();
            } catch {
              window.open(src, "_blank", "noopener");
            }
          }}
        >
          Print
        </Button>
      </div>
      <p className="mx-auto mt-2 max-w-[17rem] text-xs text-foreground/60">
        Print at 100% (&ldquo;Actual size&rdquo;) for a true 54 × 86 mm card.
      </p>
    </div>
  );
}
