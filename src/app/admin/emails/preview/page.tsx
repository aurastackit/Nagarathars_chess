import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/require-admin";
import { emailSamples } from "@/lib/email/samples";
import { organisersEmail } from "@/lib/notify";
import { missingSesVars } from "@/lib/ses";
import { Card } from "@/components/ui";
import { EmailFrame, TestSendForm } from "@/components/admin/email-frame";
import { sendTestEmails } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Email templates" };

/** Every email the site sends, rendered with sample data, with a way to send yourself a test. */
export default async function EmailPreviewPage() {
  await requireAdminPage();
  const samples = emailSamples();
  const missing = missingSesVars();
  const organisers = organisersEmail();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Email templates</h1>
        <p className="mt-1 max-w-3xl text-sm text-foreground/65">
          Every email the site sends, with sample data (not real players). Each has a plain-text
          version for inboxes that don&apos;t show HTML. Test sends start with &ldquo;[Test]&rdquo;.
        </p>
      </div>

      <Card padding="md" className="space-y-3">
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-foreground/55">Sending</dt>
          <dd data-testid="ses-status">
            {missing.length === 0
              ? "Amazon SES is configured."
              : `Not configured here (missing ${missing.join(", ")}) — sends are only logged.`}
          </dd>
          <dt className="text-foreground/55">Organisers&apos; inbox</dt>
          <dd>
            {organisers ?? (
              <span className="text-warning">
                ORGANISERS_EMAIL isn&apos;t set — contact-form messages aren&apos;t emailed, and
                replies to player emails go to the sending address.
              </span>
            )}
          </dd>
        </dl>
        <TestSendForm
          keys={samples.map((s) => s.key)}
          label={`Send all ${samples.length} as a test`}
          action={sendTestEmails}
        />
      </Card>

      <nav aria-label="Templates" className="flex flex-wrap gap-2 text-sm">
        {samples.map((s) => (
          <a
            key={s.key}
            href={`#${s.key}`}
            className="rounded-full border border-border bg-card px-3 py-1 hover:border-charcoal"
          >
            {s.title}
          </a>
        ))}
      </nav>

      {samples.map((s) => (
        <Card key={s.key} padding="md">
          <section id={s.key} aria-labelledby={`${s.key}-h`} className="scroll-mt-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id={`${s.key}-h`} className="text-lg font-semibold text-charcoal">
                  {s.title}
                </h2>
                <p className="text-sm text-foreground/60">{s.trigger}</p>
              </div>
              <TestSendForm keys={[s.key]} label="Send test" action={sendTestEmails} compact />
            </div>
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[6rem_1fr]">
              <dt className="text-foreground/55">Subject</dt>
              <dd className="font-medium" data-testid={`subject-${s.key}`}>
                {s.content.subject}
              </dd>
              {s.attachments.length > 0 && (
                <>
                  <dt className="text-foreground/55">Attached</dt>
                  <dd>{s.attachments.join(", ")}</dd>
                </>
              )}
            </dl>
            <div className="flex flex-wrap items-start gap-4">
              <div>
                <p className="mb-1 text-xs font-medium text-foreground/55">Desktop</p>
                <EmailFrame html={s.content.html} width={640} title={`${s.title} — desktop`} />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-foreground/55">Phone</p>
                <EmailFrame html={s.content.html} width={375} title={`${s.title} — phone`} />
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-sm font-medium text-charcoal">
                Plain-text version
              </summary>
              <pre
                data-testid={`text-${s.key}`}
                className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-xs"
              >
                {s.content.text}
              </pre>
            </details>
          </section>
        </Card>
      ))}
    </div>
  );
}
