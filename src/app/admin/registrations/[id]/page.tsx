import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/require-admin";
import { getRegistrationDetail } from "@/lib/registration-detail";
import { ageCategoryLabel } from "@/lib/age-category";
import { AGE_PROOF_TYPES } from "@/lib/registration-schema";
import { fixByDate } from "@/lib/registration-status";
import { formatDateTimeIST } from "@/lib/format";
import { registrationAdminHref } from "@/lib/admin-links";
import { Card } from "@/components/ui";
import { StatusBadges } from "@/components/admin/status-badge";
import { RegistrationReviewPanel } from "@/components/admin/registration-review-panel";
import {
  AdminNotesForm,
  AgeProofPreview,
  DeleteRegistrationForm,
} from "@/components/admin/registration-admin-forms";
import { IdCardViewer } from "@/components/admin/id-card-frame";
import { deleteRegistration, reviewRegistration, saveAdminNotes } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Player" };

const EVENT_LABEL: Record<string, string> = {
  submitted: "Application submitted",
  edited: "Edited and resubmitted by the player",
  confirmed: "Confirmed",
  rejected: "Rejected",
  changes_requested: "Changes requested",
  reopened: "Re-opened for review",
  withdrawn: "Withdrawn",
  email_sent: "Email sent",
  email_failed: "Email failed",
  document_viewed: "Document viewed",
  date_change_confirmed: "Replied to the new date",
};

const AGE_PROOF_LABEL = Object.fromEntries(AGE_PROOF_TYPES.map((t) => [t.value, t.label]));

const text = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <Card padding="md" className={className}>
      <section aria-labelledby={id}>
        <h2 id={id} className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </section>
    </Card>
  );
}

function Fields({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(7.5rem,40%)_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-foreground/55">{k}</dt>
          <dd className="min-w-0 break-words text-charcoal">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One registration, everything an organiser needs to decide on it, and the actions to do so. */
export default async function RegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const detail = await getRegistrationDetail(id);
  if (!detail) notFound();
  const { registration: r, duplicates, age, needsGuardian, documents, queue } = detail;
  const docHref = (doc: "photo" | "ageProof", download = false) =>
    `/api/admin/uploads?registration=${r.id}&doc=${doc}${download ? "&download=1" : ""}`;
  const fixBy = r.status === "changes_requested" && r.reviewedAt ? fixByDate(r.reviewedAt) : null;
  const warnings = Boolean(age?.message) || duplicates.length > 0 || needsGuardian;

  return (
    <div className="space-y-5">
      {/* Breadcrumb and the pending queue. */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/admin/registrations"
          className="font-medium text-foreground/60 hover:text-charcoal"
        >
          ← Players
        </Link>
        <nav aria-label="Pending applications" className="flex items-center gap-2">
          {queue.prevId ? (
            <Link
              href={registrationAdminHref(queue.prevId)}
              className="rounded-md border border-border bg-card px-3 py-1.5 font-medium hover:border-charcoal"
            >
              ← Previous pending
            </Link>
          ) : (
            <span className="rounded-md border border-border px-3 py-1.5 text-foreground/35">
              ← Previous pending
            </span>
          )}
          <span
            className="hidden text-xs text-foreground/60 sm:inline"
            data-testid="queue-position"
          >
            {queue.position
              ? `${queue.position} of ${queue.total} pending`
              : `${queue.total} pending in this tournament`}
          </span>
          {queue.nextId ? (
            <Link
              href={registrationAdminHref(queue.nextId)}
              className="rounded-md border border-border bg-card px-3 py-1.5 font-medium hover:border-charcoal"
            >
              Next pending →
            </Link>
          ) : (
            <span className="rounded-md border border-border px-3 py-1.5 text-foreground/35">
              Next pending →
            </span>
          )}
        </nav>
      </div>

      {/* Header. */}
      <Card padding="md">
        <div className="flex flex-wrap items-start gap-4">
          {documents.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- private photo via a short-lived signed URL
            <img
              src={docHref("photo")}
              alt=""
              className="size-20 flex-none rounded-full object-cover ring-2 ring-gold"
              style={{ objectPosition: "50% 30%" }}
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-20 flex-none items-center justify-center rounded-full bg-border/60 text-2xl font-semibold text-foreground/40 ring-2 ring-gold"
            >
              {r.fullName.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-bold text-charcoal">{r.fullName}</h1>
            <p className="mt-0.5 font-mono text-sm text-foreground/70">
              {r.registrationNo ?? "No number yet"}
            </p>
            <div className="mt-2">
              <StatusBadges status={r.status} dateChange={r.dateChangeResponse} />
            </div>
            <p className="mt-2 text-sm text-foreground/70">
              {ageCategoryLabel(r.ageCategory)} ·{" "}
              <Link
                href={`/admin/tournaments/${r.tournament.id}`}
                className="underline hover:text-charcoal"
              >
                {r.tournament.title}
              </Link>{" "}
              · registered {formatDateTimeIST(r.registeredAt)} IST
            </p>
          </div>
        </div>

        {/* What the player was told. */}
        {r.status === "rejected" && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-semibold">
              Rejected{r.reviewedAt ? ` on ${formatDateTimeIST(r.reviewedAt)} IST` : ""}
              {r.reviewedBy ? ` by ${r.reviewedBy}` : ""}
            </p>
            <p className="mt-1">{r.rejectionReason ?? "No reason was given."}</p>
          </div>
        )}
        {r.status === "changes_requested" && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">
              Changes requested{r.reviewedAt ? ` on ${formatDateTimeIST(r.reviewedAt)} IST` : ""}
              {r.reviewedBy ? ` by ${r.reviewedBy}` : ""}
            </p>
            <p className="mt-1">{r.rejectionReason ?? "—"}</p>
            {fixBy && (
              <p className="mt-1">
                Fix by <strong>{formatDateTimeIST(fixBy)} IST</strong> — after that it&apos;s
                rejected automatically.
              </p>
            )}
          </div>
        )}
        {r.status === "withdrawn" && (
          <div className="mt-4 rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground/80">
            <p className="font-semibold">
              Withdrawn{r.withdrawnAt ? ` on ${formatDateTimeIST(r.withdrawnAt)} IST` : ""}
            </p>
            {r.withdrawReason && <p className="mt-1">{r.withdrawReason}</p>}
          </div>
        )}

        <div className="mt-5 border-t border-border pt-4">
          <RegistrationReviewPanel
            id={r.id}
            status={r.status}
            fullName={r.fullName}
            email={r.email}
            registrationNo={r.registrationNo}
            tournament={r.tournament}
            nextPendingId={queue.nextId}
            action={reviewRegistration}
          />
        </div>
      </Card>

      {warnings && (
        <div
          role="note"
          aria-label="Check before deciding"
          className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-charcoal"
        >
          <p className="font-semibold">Check before deciding</p>
          <ul className="list-disc space-y-1 pl-5">
            {age?.message && <li data-testid="warn-age">Age vs category: {age.message}</li>}
            {needsGuardian && (
              <li data-testid="warn-guardian">
                The player may be under 18 but there&apos;s no guardian name and consent.
              </li>
            )}
            {duplicates.map((d) => (
              <li key={d.id} data-testid="warn-duplicate">
                Possible duplicate: same{" "}
                {d.samePhone && d.sameEmail ? "phone and email" : d.samePhone ? "phone" : "email"}{" "}
                as{" "}
                <Link href={registrationAdminHref(d.id)} className="font-semibold underline">
                  {d.fullName} ({d.registrationNo ?? "no number"})
                </Link>{" "}
                — {d.status.replace(/_/g, " ")}. Siblings often share a parent&apos;s phone.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Personal">
          <Fields
            rows={[
              ["Full name", r.fullName],
              [
                "Birth year",
                age
                  ? `${age.birthYear} (${age.age} in ${r.tournament.startDate.getUTCFullYear()})`
                  : "—",
              ],
              [
                "Gender",
                <span key="g" className="capitalize">
                  {text(r.gender)}
                </span>,
              ],
              ["Category", ageCategoryLabel(r.ageCategory)],
              [
                "Email",
                <a key="e" href={`mailto:${r.email}`} className="break-all underline">
                  {r.email}
                </a>,
              ],
              [
                "Mobile",
                <a
                  key="m"
                  href={`tel:${r.phone.replace(/\s/g, "")}`}
                  className="tabular-nums underline"
                >
                  {r.phone}
                </a>,
              ],
              ["City", text(r.city)],
              [
                "Address",
                <span key="a" className="whitespace-pre-line">
                  {text(r.address)}
                </span>,
              ],
              ["FIDE ID", text(r.fideId)],
              ["Rating", text(r.rating)],
              [
                "Guardian",
                r.guardianName
                  ? `${r.guardianName}${r.guardianConsent ? " (consent given)" : " (no consent)"}`
                  : "—",
              ],
              ["Declaration", r.consentAccepted ? "Accepted" : "Not accepted"],
              [
                "Payment",
                <span key="p" className="capitalize">
                  {r.paymentStatus.replace(/_/g, " ")}
                  {r.amountPaid ? ` · ₹${r.amountPaid}` : ""}
                </span>,
              ],
            ]}
          />
        </Section>

        <Section title="Family & Community">
          <Fields
            rows={[
              ["Father", text(r.fatherName)],
              ["Mother", text(r.motherName)],
              ["Father's grandparents", text(r.fatherGrandparents)],
              ["Mother's grandparents", text(r.motherGrandparents)],
              ["Native", text(r.native)],
              ["Kovil", text(r.kovil)],
              ["Pirivu", text(r.pirivu)],
              ["Mother's native", text(r.motherNative)],
              ["Mother's kovil", text(r.motherKovil)],
              ["Mother's pirivu", text(r.motherPirivu)],
              [
                "Sangam member",
                r.sangamMember
                  ? `Yes${r.sangamRelativeName ? ` — ${r.sangamRelativeName}` : ""}`
                  : "No",
              ],
            ]}
          />
        </Section>

        <Section title="Documents">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-charcoal">Passport photo</p>
              {documents.photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- private photo via a short-lived signed URL */}
                  <img
                    src={docHref("photo")}
                    alt={`Passport photo of ${r.fullName}`}
                    className="mt-2 aspect-[4/5] w-32 rounded-md border border-border bg-background object-cover"
                  />
                  <p className="mt-2 flex gap-3 text-sm">
                    <a href={docHref("photo")} target="_blank" rel="noopener" className="underline">
                      Open
                    </a>
                    <a href={docHref("photo", true)} className="underline">
                      Download
                    </a>
                  </p>
                  {documents.photoLegacy && (
                    <p className="mt-1 text-xs text-foreground/50">
                      From the old form (stored inline).
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-foreground/60">Not uploaded.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">
                Age proof
                {r.ageProofType && (
                  <span className="font-normal text-foreground/60">
                    {" "}
                    · {AGE_PROOF_LABEL[r.ageProofType] ?? r.ageProofType}
                  </span>
                )}
              </p>
              {documents.ageProof ? (
                <div className="mt-2 space-y-2">
                  <AgeProofPreview src={docHref("ageProof")} isPdf={documents.ageProofIsPdf} />
                  <p className="flex gap-3 text-sm">
                    <a
                      href={docHref("ageProof")}
                      target="_blank"
                      rel="noopener"
                      className="underline"
                    >
                      Open
                    </a>
                    <a href={docHref("ageProof", true)} className="underline">
                      Download
                    </a>
                  </p>
                  <p className="text-xs text-foreground/50">
                    Each view is recorded on the timeline.
                    {documents.ageProofLegacy && " From the old form (stored inline)."}
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-foreground/60">Not uploaded.</p>
              )}
            </div>
          </div>
        </Section>

        <Section title="ID card">
          {r.status === "confirmed" ? (
            <IdCardViewer registrationId={r.id} title={`ID card for ${r.fullName}`} />
          ) : (
            <p className="text-sm text-foreground/60">ID card available after approval.</p>
          )}
        </Section>

        <Section title="Timeline">
          {r.events.length === 0 ? (
            <p className="text-sm text-foreground/60">Nothing recorded yet.</p>
          ) : (
            <ol className="space-y-3 border-l border-border pl-4" data-testid="timeline">
              {r.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[1.3rem] top-1.5 size-2 rounded-full ${e.type === "email_failed" ? "bg-red-600" : e.type.startsWith("email") || e.type === "document_viewed" ? "bg-border" : "bg-gold"}`}
                  />
                  <p className="font-medium text-charcoal">{EVENT_LABEL[e.type] ?? e.type}</p>
                  <p className="text-xs text-foreground/55">
                    {formatDateTimeIST(e.createdAt)} IST ·{" "}
                    {e.actorType === "system"
                      ? "System"
                      : `${e.actorType === "admin" ? "Admin" : "Player"}${e.actor ? ` (${e.actor})` : ""}`}
                  </p>
                  {e.note && <p className="mt-0.5 break-words text-foreground/75">{e.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </Section>

        <div className="space-y-5">
          <Section title="Internal notes">
            <AdminNotesForm id={r.id} notes={r.adminNotes} action={saveAdminNotes} />
          </Section>

          <Section title="Record">
            <Fields
              rows={[
                [
                  "Status",
                  <StatusBadges key="s" status={r.status} dateChange={r.dateChangeResponse} />,
                ],
                ["Registered", `${formatDateTimeIST(r.registeredAt)} IST`],
                ["Last updated", `${formatDateTimeIST(r.updatedAt)} IST`],
                [
                  "Reviewed",
                  r.reviewedAt
                    ? `${formatDateTimeIST(r.reviewedAt)} IST${r.reviewedBy ? ` by ${r.reviewedBy}` : ""}`
                    : "—",
                ],
                [
                  "Record ID",
                  <span key="i" className="break-all font-mono text-xs">
                    {r.id}
                  </span>,
                ],
              ]}
            />
          </Section>

          <Section title="Delete">
            <DeleteRegistrationForm
              id={r.id}
              confirmText={r.registrationNo ?? "DELETE"}
              action={deleteRegistration}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
