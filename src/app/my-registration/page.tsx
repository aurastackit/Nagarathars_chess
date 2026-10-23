import type { Metadata } from "next";
import Link from "next/link";
import { getPlayerEmail, listOwnedRegistrations } from "@/lib/player-session";
import { canPlayerEdit, canPlayerWithdraw, nextStep } from "@/lib/self-service";
import { fixByDate, normalizeStatus } from "@/lib/registration-status";
import { formatDateRange, formatDateTimeIST, formatWeekdayDate } from "@/lib/format";
import { ageCategoryLabel } from "@/lib/age-category";
import { buildGoogleCalendarUrl } from "@/lib/ics";
import { mapUrl } from "@/lib/email/templates";
import { Badge, LinkButton, buttonClasses } from "@/components/ui";
import { PlayerSignIn, PlayerSignOut } from "@/components/self-service/player-sign-in";
import { ConfirmDateButton, WithdrawButton } from "@/components/self-service/registration-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My registration",
  description: "Check, update or withdraw your tournament registration.",
  robots: { index: false, follow: false },
};

const STATUS: Record<string, { label: string; tone: "warning" | "success" | "danger" | "gray" }> = {
  pending: { label: "Under review", tone: "warning" },
  changes_requested: { label: "Changes requested", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  rejected: { label: "Not accepted", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "gray" },
};

const CANT_MAKE_NEW_DATE = "Can't make the new tournament date";

/** A player (or parent) manages their registrations after signing in with an emailed code. */
export default async function MyRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const email = await getPlayerEmail();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="h2 text-charcoal">My registration</h1>
      {email ? (
        <Registrations email={email} highlight={q.r ?? q.updated} updated={q.updated} />
      ) : (
        <div className="mt-6">
          <PlayerSignIn />
          <p className="mt-6 text-sm text-foreground/60">
            Not registered yet?{" "}
            <Link href="/tournaments" className="font-semibold text-gold-ink hover:underline">
              See tournaments
            </Link>
            .
          </p>
        </div>
      )}
    </main>
  );
}

async function Registrations({
  email,
  highlight,
  updated,
}: {
  email: string;
  highlight?: string;
  updated?: string;
}) {
  const regs = await listOwnedRegistrations(email);
  const now = new Date();

  return (
    <div className="mt-2 space-y-6">
      <p className="text-sm text-foreground/60">
        Signed in as <strong className="text-charcoal">{email}</strong> · <PlayerSignOut />
      </p>

      {updated && regs.some((r) => r.id === updated) && (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          Thank you — your changes were sent for review. We&apos;ve emailed you a copy.
        </p>
      )}

      {regs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm">
          <p className="font-medium text-charcoal">No registrations for this email yet.</p>
          <p className="mt-1 text-foreground/70">
            If you registered with a different email, sign out and use that one.{" "}
            <Link href="/tournaments" className="font-semibold text-gold-ink hover:underline">
              See tournaments
            </Link>
          </p>
        </div>
      ) : (
        regs.map((r) => {
          const status = normalizeStatus(r.status);
          const s = STATUS[status];
          const fixBy =
            status === "changes_requested" && r.reviewedAt ? fixByDate(r.reviewedAt) : null;
          const editable = canPlayerEdit(r.status, r.tournament.startDate, now);
          const withdrawable = canPlayerWithdraw(r.status, r.tournament.endDate, now);
          const dateQuestion =
            r.dateChangeResponse === "pending" && status !== "withdrawn" && status !== "rejected";
          return (
            <article
              key={r.id}
              id={`reg-${r.id}`}
              data-testid="my-registration"
              className={`rounded-2xl border bg-card p-5 shadow-sm sm:p-6 ${highlight === r.id ? "border-gold ring-2 ring-gold/40" : "border-border"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-charcoal">{r.fullName}</h2>
                  <p className="text-sm text-foreground/70">
                    {r.tournament.title} ·{" "}
                    {formatDateRange(r.tournament.startDate, r.tournament.endDate)}
                  </p>
                  <p className="text-xs text-foreground/55">
                    {r.tournament.venue}, {r.tournament.city} · {ageCategoryLabel(r.ageCategory)}
                    {r.registrationNo && (
                      <>
                        {" · "}
                        <span className="font-mono">{r.registrationNo}</span>
                      </>
                    )}
                  </p>
                </div>
                <Badge tone={s.tone}>{s.label}</Badge>
              </div>

              <p className="mt-3 text-sm text-foreground/80">{nextStep(status)}</p>

              {status === "changes_requested" && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">What the organisers asked you to change</p>
                  <p className="mt-1 whitespace-pre-line">{r.rejectionReason ?? "—"}</p>
                  {fixBy && (
                    <p className="mt-2 font-semibold">
                      Fix by {formatDateTimeIST(fixBy)} IST
                      {fixBy < now
                        ? " — this date has passed; update now or contact the organisers."
                        : ""}
                    </p>
                  )}
                  <p lang="ta" className="mt-2 text-xs">
                    மேலே குறிப்பிட்ட மாற்றங்களைச் செய்து, கடைசி தேதிக்குள் மீண்டும் சமர்ப்பிக்கவும்.
                  </p>
                </div>
              )}
              {status === "rejected" && r.rejectionReason && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <p className="font-semibold">Reason</p>
                  <p className="mt-1 whitespace-pre-line">{r.rejectionReason}</p>
                </div>
              )}
              {status === "withdrawn" && (
                <p className="mt-3 rounded-lg bg-background p-3 text-sm text-foreground/75">
                  Withdrawn{r.withdrawnAt ? ` on ${formatDateTimeIST(r.withdrawnAt)} IST` : ""}
                  {r.withdrawReason ? ` — ${r.withdrawReason}` : ""}
                </p>
              )}
              {dateQuestion && (
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                  <p className="font-semibold">
                    The tournament has moved to {formatWeekdayDate(r.tournament.startDate)}
                  </p>
                  {r.tournament.previousStartDate && (
                    <p className="mt-0.5">
                      It was {formatWeekdayDate(r.tournament.previousStartDate)}. Can you still
                      play?
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ConfirmDateButton registrationId={r.id} />
                    <WithdrawButton
                      registrationId={r.id}
                      playerName={r.fullName}
                      presetReason={CANT_MAKE_NEW_DATE}
                      label="I can't make it — withdraw"
                    />
                  </div>
                </div>
              )}

              {status === "confirmed" && (
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/registration/${r.id}/id-card`}
                      className={buttonClasses("primary", "sm")}
                    >
                      Download ID card
                    </a>
                    <a
                      href={buildGoogleCalendarUrl(r.tournament)}
                      target="_blank"
                      rel="noopener"
                      className={buttonClasses("outline", "sm")}
                    >
                      Add to Google Calendar
                    </a>
                    <a
                      href={`/api/tournaments/${r.tournament.slug}/ics`}
                      className={buttonClasses("outline", "sm")}
                    >
                      Calendar file (.ics)
                    </a>
                    <a
                      href={mapUrl(r.tournament)}
                      target="_blank"
                      rel="noopener"
                      className={buttonClasses("outline", "sm")}
                    >
                      Directions
                    </a>
                  </div>
                  <p lang="ta" className="text-xs text-foreground/60">
                    போட்டி நாளில் இந்த அடையாள அட்டையை (அச்சிட்டு அல்லது கைப்பேசியில்) கொண்டு வரவும்.
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                {editable && (
                  <LinkButton
                    href={`/my-registration/${r.id}/edit`}
                    size="sm"
                    variant={status === "pending" ? "outline" : "primary"}
                  >
                    Update registration
                  </LinkButton>
                )}
                {withdrawable && !dateQuestion && (
                  <WithdrawButton registrationId={r.id} playerName={r.fullName} />
                )}
                <Link
                  href={`/registration/${r.id}`}
                  className="ml-auto text-sm text-foreground/60 underline hover:text-charcoal"
                >
                  Status page
                </Link>
              </div>
            </article>
          );
        })
      )}

      <p className="text-sm text-foreground/60">
        Questions?{" "}
        <Link href="/contact" className="font-semibold text-gold-ink hover:underline">
          Contact the organisers
        </Link>
        .
      </p>
    </div>
  );
}
