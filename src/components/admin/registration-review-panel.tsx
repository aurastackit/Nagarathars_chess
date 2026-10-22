"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { changesRequestedEmail, decisionEmail, type EmailContent } from "@/lib/registration-emails";
import { fixByDate, type RegistrationStatus } from "@/lib/registration-status";
import {
  MAX_REASON,
  MIN_REASON,
  REASON_REQUIRED,
  REASON_TEMPLATES,
  actionLabel,
  adminActionsFor,
  type ReviewAction,
} from "@/lib/registration-review";
import { registrationAdminHref } from "@/lib/admin-links";
import type { ActionResult } from "@/app/admin/registrations/[id]/actions";

type Props = {
  id: string;
  status: RegistrationStatus;
  fullName: string;
  email: string;
  tournamentTitle: string;
  nextPendingId: string | null;
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
};

const CONFIRM_LABEL: Record<ReviewAction, string> = {
  approve: "Approve and email the player",
  reject: "Reject and email the player",
  changes: "Send the request",
  reopen: "Re-open",
  withdraw: "Withdraw",
};

const DANGER: ReviewAction[] = ["reject", "withdraw"];

/** The email this action would send, exactly as notify.ts sends it; null when it sends none (yet). */
function emailFor(action: ReviewAction, p: Props, reason: string, now: Date): EmailContent | null {
  const base = { fullName: p.fullName, registrationId: p.id, tournamentTitle: p.tournamentTitle };
  if (action === "approve") return decisionEmail({ ...base, decision: "confirmed" });
  if (action === "reject") return decisionEmail({ ...base, decision: "rejected", reason });
  if (action === "changes")
    return changesRequestedEmail({ ...base, reason, fixBy: fixByDate(now) });
  return null;
}

/**
 * Status actions for one registration. Choosing one opens a short form: a
 * reason (with ready-made templates) where the player will see it, and a
 * preview of the email that will go out.
 */
export function RegistrationReviewPanel(props: Props) {
  const { id, status, email, nextPendingId } = props;
  const [state, formAction, pending] = useActionState(props.action, null);
  const [chosen, setChosen] = useState<ReviewAction | null>(null);
  const [reason, setReason] = useState("");
  const [now] = useState(() => new Date());
  const actions = adminActionsFor(status);

  const choose = (a: ReviewAction) => {
    setChosen(chosen === a ? null : a);
    setReason("");
  };
  const templates =
    chosen === "reject" || chosen === "changes" || chosen === "withdraw"
      ? REASON_TEMPLATES[chosen]
      : [];
  const needsReason = chosen !== null && REASON_REQUIRED.includes(chosen);
  const preview = chosen ? emailFor(chosen, props, reason.trim(), now) : null;

  return (
    <div>
      {actions.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Withdrawn is final — there are no status changes left. You can still delete it below.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Change status">
          {actions.map((a) => (
            <Button
              key={a}
              type="button"
              size="sm"
              variant={a === "approve" ? "primary" : "outline"}
              aria-expanded={chosen === a}
              onClick={() => choose(a)}
              className={
                chosen === a
                  ? "ring-2 ring-charcoal ring-offset-1"
                  : DANGER.includes(a)
                    ? "text-red-700"
                    : ""
              }
            >
              {actionLabel(a, status)}
            </Button>
          ))}
        </div>
      )}

      {state?.message && (
        <div
          role="status"
          className={`mt-3 rounded-md border px-4 py-2 text-sm ${state.ok ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}
        >
          {state.message}
          {state.ok && nextPendingId && (
            <>
              {" "}
              <Link href={registrationAdminHref(nextPendingId)} className="font-semibold underline">
                Next pending →
              </Link>
            </>
          )}
        </div>
      )}

      {/* After a successful change the new status no longer offers this action, so the form closes itself. */}
      {chosen && actions.includes(chosen) && (
        <form
          action={formAction}
          className="mt-4 space-y-3 rounded-lg border border-border bg-background/60 p-4 text-sm"
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="action" value={chosen} />
          <input type="hidden" name="from" value={status} />

          {(needsReason || chosen === "withdraw") && (
            <div>
              <label htmlFor="review-reason" className="block font-medium text-charcoal">
                {chosen === "withdraw"
                  ? "Reason (optional, kept on the timeline)"
                  : "Reason — the player reads this in the email"}
              </label>
              {templates.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Reason templates">
                  {templates.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReason(t)}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-left text-xs text-foreground/80 hover:border-charcoal hover:text-charcoal"
                    >
                      {t.length > 60 ? `${t.slice(0, 57)}…` : t}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                id="review-reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={needsReason}
                minLength={needsReason ? MIN_REASON : undefined}
                maxLength={MAX_REASON}
                rows={3}
                className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal"
              />
              <p className="text-right text-xs text-foreground/50">
                {reason.length}/{MAX_REASON}
              </p>
            </div>
          )}

          <div>
            <p className="font-medium text-charcoal">Email preview</p>
            {preview ? (
              <div className="mt-2 overflow-hidden rounded-md border border-border bg-card">
                <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1 border-b border-border px-3 py-2 text-xs">
                  <dt className="text-foreground/50">To</dt>
                  <dd className="break-all">{email}</dd>
                  <dt className="text-foreground/50">Subject</dt>
                  <dd className="font-medium" data-testid="email-subject">
                    {preview.subject}
                  </dd>
                </dl>
                <div
                  data-testid="email-body"
                  className="space-y-2 px-3 py-3 text-sm text-foreground/80 [&_a]:break-all [&_a]:text-gold-ink [&_a]:underline"
                  // Built by registration-emails.ts, which escapes everything typed in.
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              </div>
            ) : (
              <p className="mt-1 text-foreground/60">
                No email is sent for this yet — the player emails for re-open and withdraw come with
                the email update.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={pending || (needsReason && reason.trim().length < MIN_REASON)}
              variant={DANGER.includes(chosen) ? "dark" : "primary"}
            >
              {pending ? "Saving…" : CONFIRM_LABEL[chosen]}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setChosen(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
