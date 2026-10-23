import { SITE_URL } from "@/lib/site";
import { fixByDate } from "@/lib/registration-status";
import type { EmailContent } from "./render";
import {
  applicationReceivedEmail,
  approvedEmail,
  changesRequestedEmail,
  contactNotificationEmail,
  dateChangedEmail,
  registrationErrorAlertEmail,
  rejectedEmail,
  reminderEmail,
  reopenedEmail,
  signInCodeEmail,
  waitlistEmail,
  withdrawnEmail,
  type EmailRegistration,
} from "./templates";

/** Every template with made-up sample data, for the admin preview page and test sends. */

export type SampleKey =
  | "received"
  | "approved"
  | "changes"
  | "rejected"
  | "reopened"
  | "withdrawn"
  | "date_changed"
  | "reminder"
  | "contact"
  | "sign_in"
  | "waitlist"
  | "registration_alert";

export type Sample = {
  key: SampleKey;
  title: string;
  /** When it's sent. */
  trigger: string;
  /** Files sent with it (test sends attach sample versions). */
  attachments: string[];
  content: EmailContent;
};

export function sampleRegistration(now: Date): EmailRegistration {
  // A Sunday about five weeks out, so every sample reads sensibly whenever it's previewed.
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 35));
  start.setUTCDate(start.getUTCDate() + ((7 - start.getUTCDay()) % 7));
  return {
    id: "sample",
    fullName: "Sample Player",
    registrationNo: "NCC26-U11-0042",
    tournament: {
      title: "Nagarathar's Chess Championship",
      startDate: start,
      endDate: start,
      venue: "Sample Hall, 1 Sample Road",
      city: "Chennai",
    },
  };
}

export function emailSamples(now = new Date()): Sample[] {
  const r = sampleRegistration(now);
  const previousStart = new Date(r.tournament.startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sampleLink = (a: string) => `${SITE_URL}/registration/sample/respond?a=${a}&e=0&t=sample`;
  return [
    {
      key: "received",
      title: "Application received – under review",
      trigger: "When a player submits an application (or completes payment).",
      attachments: [],
      content: applicationReceivedEmail(r),
    },
    {
      key: "approved",
      title: "Approved",
      trigger: "When an admin approves (or re-opens and approves) an application.",
      attachments: ["Player ID card (PDF)", "Calendar file (.ics)"],
      content: approvedEmail(r),
    },
    {
      key: "changes",
      title: "Changes requested",
      trigger: "When an admin asks the player to fix something.",
      attachments: [],
      content: changesRequestedEmail(r, {
        reason: "Please upload a clear, front-facing passport photo (no sunglasses or caps).",
        fixBy: fixByDate(now),
      }),
    },
    {
      key: "rejected",
      title: "Rejected",
      trigger:
        "When an admin rejects an application, or 7 days pass without the requested changes.",
      attachments: [],
      content: rejectedEmail(r, {
        reason: "The player isn't eligible for this tournament's age categories.",
      }),
    },
    {
      key: "reopened",
      title: "Re-opened",
      trigger: "When an admin moves a confirmed registration back to review.",
      attachments: [],
      content: reopenedEmail(r),
    },
    {
      key: "withdrawn",
      title: "Withdrawn",
      trigger: "When an admin withdraws a registration, or the player withdraws.",
      attachments: [],
      content: withdrawnEmail(r, { reason: "Withdrawn at the player's request.", byPlayer: false }),
    },
    {
      key: "date_changed",
      title: "Event date changed",
      trigger: "When an admin saves a new start date: to every player holding a seat.",
      attachments: [],
      content: dateChangedEmail(r, {
        previousStart,
        confirmUrl: sampleLink("confirm-date"),
        withdrawUrl: sampleLink("withdraw-date"),
      }),
    },
    {
      key: "reminder",
      title: "3-day reminder",
      trigger: "Daily job: confirmed players, 3 days before the tournament.",
      attachments: [],
      content: reminderEmail(r),
    },
    {
      key: "contact",
      title: "Contact-form message (to the organisers)",
      trigger:
        "When someone sends the contact form. Goes to ORGANISERS_EMAIL; Reply-To is the sender.",
      attachments: [],
      content: contactNotificationEmail({
        name: "Sample Parent",
        email: "parent@example.com",
        message: "Hello,\nCan my daughter play in both the Under 11 and the open section?\nThanks!",
        receivedAt: now,
      }),
    },
    {
      key: "sign_in",
      title: "Sign-in code",
      trigger: "When someone asks for a one-time code (registration and self-service).",
      attachments: [],
      content: signInCodeEmail({ code: "482913" }),
    },
    {
      key: "waitlist",
      title: "Classes waitlist",
      trigger: "When someone joins the online classes waitlist.",
      attachments: [],
      content: waitlistEmail({ interestLevel: "beginner" }),
    },
    {
      key: "registration_alert",
      title: "Registration error alert (to the organisers)",
      trigger:
        "When the register API fails in a way players can't fix (at most one an hour). Goes to ORGANISERS_EMAIL.",
      attachments: [],
      content: registrationErrorAlertEmail({
        status: 400,
        error: "Invalid input: expected string, received number",
        tournament: r.tournament.title,
        at: now,
      }),
    },
  ];
}
