"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { B, PANEL, PANEL_TITLE } from "@/components/registration-wizard/briefing-ui";
import { registrationAckCookie } from "@/lib/registration-flow";

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled])";

/**
 * The registration pop-up: the only thing on a tournament page until the
 * declaration is accepted. `notice` is the server-rendered body (notes, event
 * details, divisions, safety advice); the declaration, its tick box and the
 * Continue button live here because they need state. Accepting sets a session
 * cookie for this tournament and opens the full page at its registration form.
 */
export function RegistrationGate({ slug, notice }: { slug: string; notice: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState(false);
  const [cookiesBlocked, setCookiesBlocked] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const checkboxId = useId();
  const hintId = useId();

  // Behaves like a modal: page scroll locked and keyboard focus held inside it
  // (the only ways out are accepting or the "Back to tournaments" link).
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.focus();

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!dialog.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", trapFocus);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", trapFocus);
    };
  }, []);

  function accept() {
    const name = registrationAckCookie(slug);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=1; Path=/tournaments/${slug}; SameSite=Lax${secure}`;
    // The tournament page reads this cookie to open the full page, so say so if
    // the browser refused it rather than bouncing the player straight back here.
    if (!document.cookie.includes(`${name}=1`)) {
      setCookiesBlocked(true);
      return;
    }
    startTransition(() => {
      router.replace(`/tournaments/${slug}#register`);
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center bg-charcoal/60 sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-full w-full max-w-3xl flex-col overflow-y-auto bg-background shadow-lg outline-none sm:rounded-xl"
      >
        <div className="p-4 sm:p-6">
          <Link href="/tournaments" className="text-sm font-semibold text-gold-ink hover:underline">
            &larr; Back to tournaments
          </Link>
          <h1 id={titleId} className="h2 mt-3 text-charcoal">
            Player registration
          </h1>
          <p className="mt-1 text-sm text-foreground/80">
            Please read the description and category details carefully before proceeding.
          </p>

          <div className="mt-5 space-y-4">
            {notice}

            <section className={PANEL}>
              <h2 className={PANEL_TITLE}>Declaration &amp; consent</h2>
              <p className="mt-2 text-sm text-foreground/80">
                By proceeding, you agree to the following:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-foreground/80">
                <li>
                  The information you provide is <B>true and correct</B>
                </li>
                <li>You consent to the use of your data for registration and verification</li>
                <li>
                  <B>Misrepresentation</B> may lead to rejection of the application
                </li>
              </ul>
              <label
                htmlFor={checkboxId}
                className="mt-4 flex cursor-pointer items-start gap-3 border-t border-border pt-4"
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-0.5 h-5 w-5 flex-none cursor-pointer accent-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                />
                <span className="text-sm font-medium text-foreground">
                  I understand Nagarathar&apos;s Chess Championship will never ask for OTP or
                  payments via chat/phone
                </span>
              </label>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                disabled={!checked || pending}
                aria-describedby={checked ? undefined : hintId}
                onClick={accept}
              >
                {pending ? "Opening…" : "Continue to registration"}
              </Button>
              {!checked && (
                <p id={hintId} className="text-small text-muted">
                  Tick the box above to continue.
                </p>
              )}
            </div>
            {cookiesBlocked && (
              <p role="alert" className="text-sm text-red-600">
                Your browser is blocking cookies, so the page can&apos;t be opened. Please allow
                cookies for this site and try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
