import Link from "next/link";
import { ShieldIcon } from "@/components/icons/misc";
import { B, BULLETS, PANEL, PANEL_TITLE } from "@/components/registration-wizard/briefing-ui";
import { RegistrationEventCard } from "@/components/registration-wizard/registration-event-card";
import { AGE_CATEGORIES, ageRangeLabel } from "@/lib/age-category";
import { formatDate } from "@/lib/format";
import { REGISTRATION_STEPS } from "@/lib/registration-schema";
import { SITE_URL } from "@/lib/site";
import { SUPPORT_CONTACTS } from "@/lib/support-contacts";

// The address people are told to trust, taken from config (not typed in) so the
// notice always names the real site.
const SITE_ORIGIN = new URL(SITE_URL).origin;

/**
 * Everything the registration pop-up says before the declaration: notes, steps,
 * event details, divisions, support contacts and safety advice. Server
 * component (the event card draws its QR codes on the server); the pop-up's
 * frame and the declaration itself are in RegistrationGate.
 */
export function RegistrationNotice({
  tournament,
}: {
  tournament: {
    slug: string;
    title: string;
    venue: string;
    city: string;
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
  };
}) {
  return (
    <>
      <section className={PANEL}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className={PANEL_TITLE}>Note</h3>
            <ul className={BULLETS}>
              <li>
                Players must register with a <B>valid email</B> and verify using OTP
              </li>
              <li>
                Provide accurate details as per Aadhaar (DOB), and upload required images (passport
                size photo &amp; Aadhaar/ID)
              </li>
              <li>
                After submission, applications will be <B>reviewed by admins</B> for authenticity
              </li>
            </ul>
          </div>
          <div>
            <h3 className={PANEL_TITLE}>Registration protocol</h3>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-foreground/80">
              <li>
                Click <B>Continue to registration</B> below and enter your email
              </li>
              <li>
                Verify using the <B>OTP</B> sent to your email
              </li>
              <li>Fill in the form ({REGISTRATION_STEPS.join(", ")})</li>
              <li>
                <B>Submit</B> and wait for admin approval
              </li>
              <li>
                Forms must be submitted on or before{" "}
                <B>{formatDate(tournament.registrationDeadline)}</B> to be eligible for the
                tournament
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className={PANEL}>
        <RegistrationEventCard tournament={tournament} />
      </section>

      <section className={PANEL}>
        <h3 className={PANEL_TITLE}>Player divisions</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Player divisions by age</caption>
            <thead>
              <tr className="text-xs text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Division
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Age in the tournament year
                </th>
                <th scope="col" className="py-2 font-medium">
                  Gender
                </th>
              </tr>
            </thead>
            <tbody>
              {AGE_CATEGORIES.map((c) => (
                <tr key={c.value} className="border-t border-border">
                  <th
                    scope="row"
                    className="whitespace-nowrap py-2 pr-4 font-medium text-foreground"
                  >
                    {c.label}
                  </th>
                  <td className="py-2 pr-4 text-foreground/80">{ageRangeLabel(c.value)}</td>
                  <td className="py-2 text-foreground/80">Any</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Your category is set automatically from your year of birth and can&apos;t be changed.
        </p>
      </section>

      {SUPPORT_CONTACTS.length > 0 && (
        <section className={PANEL}>
          <h3 className={PANEL_TITLE}>Support contact</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">People to contact for help with registration</caption>
              <thead>
                <tr className="text-xs text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Name
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Contact no
                  </th>
                </tr>
              </thead>
              <tbody>
                {SUPPORT_CONTACTS.map((c) => (
                  <tr key={c.phone} className="border-t border-border">
                    <th
                      scope="row"
                      className="whitespace-nowrap py-2 pr-4 font-medium text-foreground"
                    >
                      {c.name}
                    </th>
                    <td className="py-2 text-foreground/80">
                      <a
                        href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                        className="underline underline-offset-2"
                      >
                        {c.phone}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-warning/30 bg-warning/5 p-4 sm:p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-warning">
          <ShieldIcon className="h-5 w-5 flex-none" aria-hidden="true" />
          Stay safe
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/80 marker:text-warning">
          <li>
            We will <B>never</B> ask for your OTP, passwords, or card PIN
          </li>
          <li>No payments via personal UPI, WhatsApp, or SMS links</li>
          <li>
            Use only{" "}
            <strong className="break-all font-semibold text-foreground">{SITE_ORIGIN}</strong> for
            registration
          </li>
          <li>
            Report suspicious messages using the{" "}
            <Link href="/contact" className="font-semibold text-foreground underline">
              contact details on our site
            </Link>
          </li>
        </ul>
        <p className="mt-3 text-sm font-medium text-foreground">
          If in doubt, stop and verify with the official contacts.
        </p>
      </section>
    </>
  );
}
