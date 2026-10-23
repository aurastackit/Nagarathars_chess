import { test } from "node:test";
import assert from "node:assert/strict";
import { renderEmail, safeHref } from "./render";
import {
  applicationReceivedEmail,
  approvedEmail,
  changesRequestedEmail,
  contactNotificationEmail,
  dateChangedEmail,
  rejectedEmail,
  reminderEmail,
  reopenedEmail,
  signInCodeEmail,
  waitlistEmail,
  withdrawnEmail,
  type EmailRegistration,
} from "./templates";
import { emailSamples } from "./samples";
import { buildRawEmail, encodeHeader } from "./mime";
import { checkActionQuery, signActionQuery } from "./action-links";
import { daysUntilIST } from "../reminder-schedule";
import { buildTournamentIcs } from "../ics";

const EVIL = `<script>alert("x")</script>`;
const evil: EmailRegistration = {
  id: "reg1",
  fullName: `Ravi ${EVIL}`,
  registrationNo: "NCC26-A19-0001",
  tournament: {
    title: `Open & Rapid ${EVIL}`,
    startDate: new Date("2026-12-27T00:00:00Z"),
    endDate: new Date("2026-12-27T00:00:00Z"),
    venue: `Hall <b>1</b>`,
    city: "Chennai",
  },
};
const when = new Date("2026-10-23T06:30:00Z");

const all = [
  applicationReceivedEmail(evil),
  approvedEmail(evil),
  changesRequestedEmail(evil, { reason: `Fix ${EVIL}`, fixBy: when }),
  rejectedEmail(evil, { reason: `No ${EVIL}` }),
  reopenedEmail(evil),
  withdrawnEmail(evil, { reason: `Gone ${EVIL}`, byPlayer: true }),
  dateChangedEmail(evil, {
    previousStart: new Date("2026-12-20T00:00:00Z"),
    confirmUrl: "https://example.org/c",
    withdrawUrl: "https://example.org/w",
  }),
  reminderEmail(evil),
  contactNotificationEmail({
    name: `Mum ${EVIL}`,
    email: "a@b.c",
    message: `Hi ${EVIL}`,
    receivedAt: when,
  }),
  signInCodeEmail({ code: "123456" }),
  waitlistEmail({ interestLevel: "beginner" }),
];

test("every template escapes every value in the HTML, and has a plain-text version", () => {
  for (const e of all) {
    assert.ok(!e.html.includes("<script>"), e.subject);
    assert.ok(!e.html.includes("<b>1</b>"), e.subject);
    assert.ok(e.html.startsWith("<!doctype html>"));
    assert.ok(e.html.includes('name="viewport"'), "mobile viewport");
    assert.ok(e.html.includes("/brand/email-logo.png"), "logo");
    assert.ok(e.text.length > 80 && !e.text.includes("<p"), "plain text, no tags");
  }
  const rejected = all[3];
  assert.ok(rejected.html.includes("No &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"));
  assert.ok(rejected.text.includes(`No ${EVIL}`), "plain text keeps the words as typed");
});

test("submit email says the application is under review, never that they're registered", () => {
  const e = applicationReceivedEmail(evil);
  assert.match(e.subject, /^Application received – under review: /);
  assert.ok(e.text.includes("NCC26-A19-0001"));
  assert.ok(e.text.includes("/registration/reg1"));
  assert.ok(!/you're registered/i.test(e.html + e.text));
});

test("approved email links the ID card, directions and calendar", () => {
  const e = approvedEmail(evil);
  assert.ok(e.text.includes("/api/registration/reg1/id-card"));
  assert.ok(e.text.includes("https://www.google.com/maps/dir/?api=1&destination="));
  assert.ok(e.text.includes("https://calendar.google.com/calendar/render?"));
});

test("changes, date-change and contact emails carry what they promise", () => {
  const c = changesRequestedEmail(evil, { reason: "Photo unclear", fixBy: when });
  assert.match(c.subject, /^Action needed by 23 Oct 2026, 12:00 pm: /);
  assert.ok(c.text.includes("> Photo unclear") && c.text.includes("Update your application: "));
  const d = all[6];
  assert.ok(d.text.includes("Yes, I'll be there: https://example.org/c"));
  assert.ok(d.text.includes("I can't make it — withdraw: https://example.org/w"));
  assert.ok(d.text.includes("Sunday, 20 Dec 2026") && d.text.includes("Sunday, 27 Dec 2026"));
  const m = all[8];
  assert.ok(m.text.includes("Mum") && m.text.includes("a@b.c"));
});

test("links: only http(s) and mailto survive", () => {
  assert.equal(safeHref("javascript:alert(1)"), "#");
  assert.equal(safeHref("data:text/html,x"), "#");
  assert.equal(safeHref("https://x.org/a?b=1&c=2"), "https://x.org/a?b=1&c=2");
  const e = renderEmail({
    subject: "s",
    preheader: "p",
    heading: "h",
    blocks: [{ kind: "buttons", buttons: [{ label: "Go", href: "javascript:alert(1)" }] }],
  });
  assert.ok(!e.html.includes("javascript:"));
});

test("the preview samples cover every template", () => {
  const keys = emailSamples(when).map((s) => s.key);
  assert.deepEqual(keys, [
    "received",
    "approved",
    "changes",
    "rejected",
    "reopened",
    "withdrawn",
    "date_changed",
    "reminder",
    "contact",
    "sign_in",
    "waitlist",
    "registration_alert",
  ]);
});

test("MIME: UTF-8 subjects are encoded, parts are base64 and decode back", () => {
  assert.equal(encodeHeader("Confirmed: Open"), "Confirmed: Open");
  assert.equal(
    encodeHeader("Application received – under review"),
    `=?UTF-8?B?${Buffer.from("Application received – under review").toString("base64")}?=`
  );
  const raw = buildRawEmail({
    from: "a@x.org",
    to: "b@y.org",
    replyTo: "c@z.org",
    subject: "மீனா – test",
    html: "<p>மீனாட்சி – hello</p>",
    text: "மீனாட்சி – hello",
    attachments: [
      {
        filename: "card.pdf",
        contentBase64: Buffer.from("PDF").toString("base64"),
        contentType: "application/pdf",
      },
    ],
    boundarySeed: "t",
  });
  assert.ok(raw.includes("Reply-To: c@z.org\r\n"));
  assert.ok(raw.includes('Content-Type: multipart/mixed; boundary="mixed_t"'));
  assert.ok(raw.includes('Content-Type: multipart/alternative; boundary="alt_t"'));
  assert.ok(raw.includes("Content-Type: text/plain; charset=UTF-8"));
  assert.ok(raw.includes(Buffer.from("<p>மீனாட்சி – hello</p>").toString("base64")));
  assert.ok(raw.includes('Content-Disposition: attachment; filename="card.pdf"'));
  assert.ok(raw.trimEnd().endsWith("--mixed_t--"));
  assert.ok(
    raw.split("\r\n").every((l) => l.length <= 998),
    "line length"
  );
});

test("signed action links: valid, tamper-proof, action-bound and expiring", () => {
  const q = new URLSearchParams(signActionQuery("reg1", "withdraw-date", "s3cret", 0));
  const parts = { a: q.get("a"), e: q.get("e"), t: q.get("t") };
  assert.deepEqual(checkActionQuery("reg1", parts, "s3cret", 1000), {
    ok: true,
    action: "withdraw-date",
  });
  assert.equal(checkActionQuery("reg2", parts, "s3cret", 1000).ok, false, "other registration");
  assert.equal(
    checkActionQuery("reg1", { ...parts, a: "confirm-date" }, "s3cret", 1000).ok,
    false,
    "other action"
  );
  assert.equal(checkActionQuery("reg1", parts, "other", 1000).ok, false, "other secret");
  assert.equal(
    checkActionQuery("reg1", { ...parts, e: String(Number(parts.e) + 1) }, "s3cret", 1000).ok,
    false,
    "longer expiry"
  );
  assert.deepEqual(checkActionQuery("reg1", parts, "s3cret", 31 * 86400e3), {
    ok: false,
    reason: "expired",
  });
  assert.deepEqual(checkActionQuery("reg1", { a: "x", e: "1", t: "y" }, "s3cret"), {
    ok: false,
    reason: "invalid",
  });
});

test("reminder: whole IST days until the start", () => {
  const start = new Date("2026-12-27T00:00:00Z");
  assert.equal(daysUntilIST(start, new Date("2026-12-24T03:30:00Z")), 3); // 9:00 IST on the 24th
  assert.equal(daysUntilIST(start, new Date("2026-12-23T19:00:00Z")), 3); // 00:30 IST on the 24th
  assert.equal(daysUntilIST(start, new Date("2026-12-23T18:00:00Z")), 4); // 23:30 IST on the 23rd
  assert.equal(daysUntilIST(start, new Date("2026-12-27T03:30:00Z")), 0);
});

test("calendar file: an all-day event over the tournament's dates", () => {
  const ics = buildTournamentIcs({ ...evil.tournament, slug: "open", description: "d" });
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261227"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20261228"));
});
