import { formatDateRange, formatDateTimeIST, formatWeekdayDate } from "@/lib/format";
import { buildGoogleCalendarUrl } from "@/lib/ics";
import { SITE_URL } from "@/lib/site";
import { renderEmail, type Block, type EmailContent } from "./render";

/**
 * Every email the site sends, as pure functions of their data (no server
 * imports): the sender, the admin preview page and the tests all use these.
 */

export type EmailTournament = {
  title: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  city: string;
};

export type EmailRegistration = {
  id: string;
  fullName: string;
  registrationNo: string | null;
  tournament: EmailTournament;
};

export const statusUrl = (id: string) => `${SITE_URL}/registration/${id}`;
export const idCardUrl = (id: string) => `${SITE_URL}/api/registration/${id}/id-card`;
export const contactUrl = () => `${SITE_URL}/contact`;
export const mapUrl = (t: EmailTournament) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${t.venue}, ${t.city}`)}`;

const eventRows = (r: EmailRegistration): [string, string][] => [
  ["Tournament", r.tournament.title],
  ["Date", formatDateRange(r.tournament.startDate, r.tournament.endDate)],
  ["Venue", `${r.tournament.venue}, ${r.tournament.city}`],
  ...(r.registrationNo ? ([["Registration no.", r.registrationNo]] as [string, string][]) : []),
];

const hi = (name: string): Block => ({ kind: "p", parts: [`Hi ${name},`] });
const playerFooter =
  "You're receiving this because you registered for a tournament on our website.";

/** Sent the moment an application is submitted (or paid for). Not a confirmation. */
export function applicationReceivedEmail(r: EmailRegistration): EmailContent {
  return renderEmail({
    subject: `Application received – under review: ${r.tournament.title}`,
    preheader: `We've received your application${r.registrationNo ? ` (${r.registrationNo})` : ""}. The organisers will review it shortly.`,
    heading: "Application received – under review",
    blocks: [
      hi(r.fullName),
      {
        kind: "p",
        parts: [
          "Thank you — we've received your application for ",
          { strong: r.tournament.title },
          ".",
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "This is not a confirmation yet",
        parts: [
          "The organisers check every application. You'll get another email when it's approved, or if anything needs changing.",
        ],
      },
      { kind: "details", rows: eventRows(r) },
      { kind: "buttons", buttons: [{ label: "Check your status", href: statusUrl(r.id) }] },
      { kind: "p", parts: ["Keep your registration number handy — you'll need it on the day."] },
    ],
    footerNote: playerFooter,
  });
}

/** Approved: the ID card is attached, plus directions and calendar links. */
export function approvedEmail(r: EmailRegistration): EmailContent {
  return renderEmail({
    subject: `Confirmed: ${r.tournament.title}`,
    preheader: `You're confirmed for ${r.tournament.title}. Your player ID card is attached.`,
    heading: "You're confirmed!",
    blocks: [
      hi(r.fullName),
      {
        kind: "p",
        parts: [
          "Your registration for ",
          { strong: r.tournament.title },
          " has been approved. See you there!",
        ],
      },
      { kind: "details", rows: eventRows(r) },
      {
        kind: "callout",
        tone: "success",
        title: "Your player ID card is attached",
        parts: [
          "Print it at 100% (actual size) or keep it on your phone, and bring it on the day. You can also ",
          { link: "download it again", href: idCardUrl(r.id) },
          ".",
        ],
      },
      {
        kind: "buttons",
        buttons: [
          { label: "Get directions", href: mapUrl(r.tournament) },
          {
            label: "Add to Google Calendar",
            href: buildGoogleCalendarUrl(r.tournament),
            secondary: true,
          },
        ],
      },
      {
        kind: "p",
        parts: [
          "A calendar file (.ics) is attached too, for Apple or Outlook calendars. Track your registration at ",
          { link: "your status page", href: statusUrl(r.id) },
          ".",
        ],
      },
    ],
    footerNote: playerFooter,
  });
}

export function changesRequestedEmail(
  r: EmailRegistration,
  p: { reason: string; fixBy: Date }
): EmailContent {
  const fixBy = `${formatDateTimeIST(p.fixBy)} IST`;
  return renderEmail({
    subject: `Action needed by ${formatDateTimeIST(p.fixBy)}: ${r.tournament.title}`,
    preheader: `Your application needs a change before it can be confirmed. Please update it by ${fixBy}.`,
    heading: "Your application needs a change",
    blocks: [
      hi(r.fullName),
      {
        kind: "p",
        parts: [
          "Your application for ",
          { strong: r.tournament.title },
          " needs a change before it can be confirmed:",
        ],
      },
      { kind: "quote", text: p.reason },
      {
        kind: "callout",
        tone: "warning",
        title: `Please update it by ${fixBy}`,
        parts: [
          "Your seat is held until then. After that, the application is rejected automatically.",
        ],
      },
      { kind: "buttons", buttons: [{ label: "Update your application", href: statusUrl(r.id) }] },
      { kind: "details", rows: eventRows(r) },
    ],
    footerNote: playerFooter,
  });
}

export function rejectedEmail(r: EmailRegistration, p: { reason: string | null }): EmailContent {
  return renderEmail({
    subject: `Update on your registration for ${r.tournament.title}`,
    preheader: "We're sorry — your registration could not be confirmed.",
    heading: "Your registration could not be confirmed",
    blocks: [
      hi(r.fullName),
      {
        kind: "p",
        parts: [
          "We're sorry — your registration for ",
          { strong: r.tournament.title },
          " could not be confirmed.",
        ],
      },
      ...(p.reason?.trim() ? ([{ kind: "quote", text: p.reason.trim() }] as Block[]) : []),
      {
        kind: "p",
        parts: [
          "If you think this is a mistake, or you'd like to talk it through, reply to this email or ",
          { link: "contact the organisers", href: contactUrl() },
          ".",
        ],
      },
      { kind: "details", rows: eventRows(r) },
    ],
    footerNote: playerFooter,
  });
}

/** An admin moved a confirmed registration back to review. */
export function reopenedEmail(r: EmailRegistration): EmailContent {
  return renderEmail({
    subject: `Your registration is being reviewed again: ${r.tournament.title}`,
    preheader: "The organisers are taking another look at your registration.",
    heading: "Your registration is being reviewed again",
    blocks: [
      hi(r.fullName),
      {
        kind: "p",
        parts: [
          "The organisers have re-opened your registration for ",
          { strong: r.tournament.title },
          " for another review. It's back to ",
          { strong: "under review" },
          " for now, and your seat is still held.",
        ],
      },
      {
        kind: "p",
        parts: [
          "You don't need to do anything unless we contact you. We'll email you as soon as it's decided.",
        ],
      },
      { kind: "buttons", buttons: [{ label: "Check your status", href: statusUrl(r.id) }] },
      { kind: "details", rows: eventRows(r) },
    ],
    footerNote: playerFooter,
  });
}

export function withdrawnEmail(
  r: EmailRegistration,
  p: { reason: string | null; byPlayer: boolean }
): EmailContent {
  return renderEmail({
    subject: `Withdrawn: ${r.tournament.title}`,
    preheader: "Your registration has been withdrawn and your seat released.",
    heading: "Your registration has been withdrawn",
    blocks: [
      hi(r.fullName),
      {
        kind: "p",
        parts: [
          p.byPlayer
            ? "As you asked, your registration for "
            : "The organisers have withdrawn your registration for ",
          { strong: r.tournament.title },
          " and released your seat.",
        ],
      },
      ...(p.reason?.trim() ? ([{ kind: "quote", text: p.reason.trim() }] as Block[]) : []),
      {
        kind: "p",
        parts: [
          "If this wasn't what you wanted, reply to this email or ",
          { link: "contact the organisers", href: contactUrl() },
          " as soon as possible.",
        ],
      },
      { kind: "details", rows: eventRows(r) },
    ],
    footerNote: playerFooter,
  });
}

/** The event moved: the player confirms they can still come, or withdraws. */
export function dateChangedEmail(
  r: EmailRegistration,
  p: { previousStart: Date; confirmUrl: string; withdrawUrl: string }
): EmailContent {
  const newDates = formatDateRange(r.tournament.startDate, r.tournament.endDate);
  return renderEmail({
    subject: `New date for ${r.tournament.title}: ${newDates} — please confirm`,
    preheader: `${r.tournament.title} has moved to ${newDates}. Please tell us whether you can still play.`,
    heading: "The tournament date has changed",
    blocks: [
      hi(r.fullName),
      {
        kind: "p",
        parts: [{ strong: r.tournament.title }, " has moved to a new date:"],
      },
      {
        kind: "details",
        rows: [
          ["Was", formatWeekdayDate(p.previousStart)],
          [
            "Now",
            `${formatWeekdayDate(r.tournament.startDate)}${r.tournament.endDate.toDateString() !== r.tournament.startDate.toDateString() ? ` – ${formatWeekdayDate(r.tournament.endDate)}` : ""}`,
          ],
          ["Venue", `${r.tournament.venue}, ${r.tournament.city}`],
          ...(r.registrationNo
            ? ([["Registration no.", r.registrationNo]] as [string, string][])
            : []),
        ],
      },
      { kind: "p", parts: ["Please let us know whether you can still play on the new date:"] },
      {
        kind: "buttons",
        buttons: [
          { label: "Yes, I'll be there", href: p.confirmUrl },
          { label: "I can't make it — withdraw", href: p.withdrawUrl, secondary: true },
        ],
      },
      {
        kind: "p",
        parts: [
          "Each button opens a page where you confirm your choice. If you do nothing, your registration stays as it is.",
        ],
      },
    ],
    footerNote: playerFooter,
  });
}

/** Three days before the event, to confirmed players. */
export function reminderEmail(r: EmailRegistration): EmailContent {
  return renderEmail({
    subject: `See you on ${formatWeekdayDate(r.tournament.startDate)}: ${r.tournament.title}`,
    preheader: `${r.tournament.title} is in 3 days. Bring your player ID card.`,
    heading: "Three days to go!",
    blocks: [
      hi(r.fullName),
      {
        kind: "p",
        parts: [
          { strong: r.tournament.title },
          " is coming up. Here's everything you need for the day.",
        ],
      },
      { kind: "details", rows: eventRows(r) },
      {
        kind: "callout",
        tone: "info",
        title: "Bring your player ID card",
        parts: [
          "Printed or on your phone. Lost it? ",
          { link: "Download it again", href: idCardUrl(r.id) },
          ".",
        ],
      },
      {
        kind: "buttons",
        buttons: [
          { label: "Get directions", href: mapUrl(r.tournament) },
          {
            label: "Add to Google Calendar",
            href: buildGoogleCalendarUrl(r.tournament),
            secondary: true,
          },
        ],
      },
      {
        kind: "p",
        parts: [
          "Can't come any more? Please ",
          { link: "let the organisers know", href: contactUrl() },
          " so someone else can have your seat.",
        ],
      },
    ],
    footerNote: playerFooter,
  });
}

/** A message from the contact form, to the organisers. Reply-To is the sender. */
export function contactNotificationEmail(p: {
  name: string;
  email: string;
  message: string;
  receivedAt: Date;
}): EmailContent {
  return renderEmail({
    subject: `New message from ${p.name} (website contact form)`,
    preheader: p.message.slice(0, 120),
    heading: "New message from the website",
    blocks: [
      {
        kind: "details",
        rows: [
          ["From", p.name],
          ["Email", p.email],
          ["Received", `${formatDateTimeIST(p.receivedAt)} IST`],
        ],
      },
      { kind: "quote", text: p.message },
      {
        kind: "p",
        parts: [
          "Reply to this email to answer them directly. All messages are also in the ",
          { link: "admin Messages page", href: `${SITE_URL}/admin/messages` },
          ".",
        ],
      },
    ],
    footerNote: "Sent to the organisers by the contact form on the website.",
  });
}

export function signInCodeEmail(p: { code: string }): EmailContent {
  return renderEmail({
    subject: "Your sign-in code",
    preheader: `Your code is ${p.code}. It expires in 10 minutes.`,
    heading: "Your sign-in code",
    blocks: [
      { kind: "p", parts: ["Use this code to continue on Nagarathar's Chess Championship:"] },
      { kind: "code", code: p.code },
      {
        kind: "p",
        parts: [
          "It expires in 10 minutes. If you didn't ask for it, you can ignore this email — nobody can sign in without the code.",
        ],
      },
    ],
    footerNote: "You're receiving this because someone entered this email address on our website.",
  });
}

const WAITLIST_LEVEL: Record<string, string> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

export function waitlistEmail(p: { interestLevel?: string | null }): EmailContent {
  const level = p.interestLevel ? WAITLIST_LEVEL[p.interestLevel] : undefined;
  return renderEmail({
    subject: "You're on the waitlist for Nagarathar's Chess online classes",
    preheader: "We'll email you as soon as online classes open.",
    heading: "You're on the waitlist",
    blocks: [
      { kind: "p", parts: ["Hi,"] },
      {
        kind: "p",
        parts: [
          "Thanks for joining the waitlist for Nagarathar's Chess online classes. We'll email you as soon as classes open",
          level ? ` — we've noted that you're interested in ${level} classes.` : ".",
        ],
      },
      { kind: "buttons", buttons: [{ label: "See what's planned", href: `${SITE_URL}/classes` }] },
      {
        kind: "p",
        parts: ["If you didn't sign up, you can ignore this email and we won't contact you again."],
      },
    ],
    footerNote: "You're receiving this because this address joined our classes waitlist.",
  });
}
