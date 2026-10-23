import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOwnedRegistration, getPlayerEmail } from "@/lib/player-session";
import {
  canPlayerEdit,
  fieldsNeedingAttention,
  registrationToFormValues,
} from "@/lib/self-service";
import { fixByDate, normalizeStatus } from "@/lib/registration-status";
import { formatDateRange, formatDateTimeIST } from "@/lib/format";
import { EditRegistrationForm } from "@/components/self-service/edit-registration-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Update registration",
  robots: { index: false, follow: false },
};

/** A signed-in player updates their application; the organisers' note is on top, the fields it mentions outlined. */
export default async function EditMyRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const email = await getPlayerEmail();
  if (!email) redirect(`/my-registration?r=${id}`);
  const r = await getOwnedRegistration(id, email);
  if (!r) notFound();
  if (!canPlayerEdit(r.status, r.tournament.startDate)) redirect(`/my-registration?r=${id}`);

  const status = normalizeStatus(r.status);
  const note = status === "changes_requested" || status === "rejected" ? r.rejectionReason : null;
  const attention = fieldsNeedingAttention(note);
  const fixBy = status === "changes_requested" && r.reviewedAt ? fixByDate(r.reviewedAt) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/my-registration"
        className="text-sm font-medium text-foreground/60 hover:text-charcoal"
      >
        ← My registration
      </Link>
      <h1 className="h2 mt-3 text-charcoal">Update your registration</h1>
      <p className="mt-1 text-sm text-foreground/70">
        {r.fullName} · {r.tournament.title} ·{" "}
        {formatDateRange(r.tournament.startDate, r.tournament.endDate)}
        {r.registrationNo && (
          <>
            {" · "}
            <span className="font-mono">{r.registrationNo}</span>
          </>
        )}
      </p>

      {note && (
        <div
          className={`mt-5 rounded-lg border p-4 text-sm ${status === "rejected" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
        >
          <p className="font-semibold">
            {status === "rejected"
              ? "Why it wasn't accepted"
              : "What the organisers asked you to change"}
          </p>
          <p className="mt-1 whitespace-pre-line">{note}</p>
          {fixBy && <p className="mt-2 font-semibold">Fix by {formatDateTimeIST(fixBy)} IST</p>}
          {attention.length > 0 && (
            <p className="mt-2">The fields this is about are outlined below.</p>
          )}
        </div>
      )}
      <p lang="ta" className="mt-3 text-xs text-foreground/60">
        குறிக்கப்பட்ட பகுதிகளைச் சரிபார்த்துத் திருத்தி, மீண்டும் அனுப்பவும்.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <EditRegistrationForm
          registrationId={r.id}
          tournamentSlug={r.tournament.slug}
          tournamentStartDate={r.tournament.startDate.toISOString()}
          initialValues={registrationToFormValues(r)}
          attention={attention}
        />
      </div>
    </main>
  );
}
