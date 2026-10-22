"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { RegistrationGate } from "@/components/registration-wizard/registration-gate";
import { registrationAckCookie } from "@/lib/registration-flow";

/**
 * "pending" until the browser has checked the cookie and URL — which is also
 * what the cached static HTML shows: the full page, no pop-up, no form.
 */
type Stage = "pending" | "notice" | "open";
const StageContext = createContext<Stage>("pending");

function hasAccepted(slug: string) {
  return document.cookie.split("; ").includes(`${registrationAckCookie(slug)}=1`);
}

/** Reports whether the URL carries ?notice — including same-page navigations from a Register link. */
function NoticeParam({ onChange }: { onChange: (forced: boolean) => void }) {
  const forced = useSearchParams().has("notice");
  useEffect(() => onChange(forced), [forced, onChange]);
  return null;
}

/**
 * The tournament page is statically rendered, so who sees the registration
 * notice is decided here in the browser rather than on the server: anyone who
 * hasn't accepted it for this tournament (cookie), or who arrives via a
 * Register link (?notice), gets it as a modal over the inert page. Accepting
 * closes it and opens the form (see RegisterSlot).
 */
export function RegistrationFlow({
  slug,
  canRegister,
  notice,
  children,
}: {
  slug: string;
  canRegister: boolean;
  notice: ReactNode;
  children: ReactNode;
}) {
  const [stage, setStage] = useState<Stage>("pending");
  const decide = useCallback(
    (forced: boolean) =>
      setStage(canRegister && (forced || !hasAccepted(slug)) ? "notice" : "open"),
    [canRegister, slug]
  );

  return (
    <StageContext.Provider value={stage}>
      <Suspense fallback={null}>
        <NoticeParam onChange={decide} />
      </Suspense>
      {stage === "notice" && (
        <RegistrationGate slug={slug} notice={notice} onAccepted={() => setStage("open")} />
      )}
      <div inert={stage === "notice"}>{children}</div>
    </StageContext.Provider>
  );
}

/**
 * Where the registration form goes. Its code (react-hook-form, zod, six steps)
 * only loads once the notice is out of the way; until then, the same
 * placeholder as the lazy loader, so opening it doesn't shift the page.
 */
export function RegisterSlot({ children }: { children: ReactNode }) {
  const stage = useContext(StageContext);
  return stage === "open" ? (
    children
  ) : (
    <div className="h-64 rounded-lg bg-charcoal/5" aria-hidden="true" />
  );
}
