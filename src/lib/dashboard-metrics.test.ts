import { test } from "node:test";
import assert from "node:assert/strict";
import {
  approvalRate,
  dailyRegistrationsAndEdits,
  istDayKey,
  lastDaysIST,
  relativeTime,
  seatsLeft,
} from "./dashboard-metrics";

test("days are India time: 20:00 UTC is already the next day in IST", () => {
  assert.equal(istDayKey(new Date("2026-10-22T18:29:00Z")), "2026-10-22");
  assert.equal(istDayKey(new Date("2026-10-22T18:31:00Z")), "2026-10-23");
});

test("last 14 IST days end today, oldest first, no gaps", () => {
  const days = lastDaysIST(14, new Date("2026-10-22T20:00:00Z")); // 23 Oct 01:30 IST
  assert.equal(days.length, 14);
  assert.equal(days[13].key, "2026-10-23");
  assert.equal(days[0].key, "2026-10-10");
  assert.equal(days[13].label, "23 Oct");
});

test("submissions and edits land on their IST day; other events and old days are ignored", () => {
  const days = lastDaysIST(3, new Date("2026-10-22T06:00:00Z"));
  const rows = dailyRegistrationsAndEdits(
    [
      { type: "submitted", createdAt: new Date("2026-10-21T19:00:00Z") }, // 22 Oct IST
      { type: "submitted", createdAt: new Date("2026-10-22T05:00:00Z") },
      { type: "edited", createdAt: new Date("2026-10-20T10:00:00Z") },
      { type: "confirmed", createdAt: new Date("2026-10-22T05:00:00Z") },
      { type: "submitted", createdAt: new Date("2026-09-01T05:00:00Z") },
    ],
    days
  );
  assert.deepEqual(
    rows.map((r) => [r.day, r.registrations, r.edits]),
    [
      ["2026-10-20", 0, 1],
      ["2026-10-21", 0, 0],
      ["2026-10-22", 2, 0],
    ]
  );
});

test("approval rate counts only decided applications", () => {
  assert.equal(approvalRate(0, 0), null);
  assert.equal(approvalRate(3, 1), 75);
  assert.equal(approvalRate(2, 1), 67);
});

test("seats left: null without a limit, never negative", () => {
  assert.equal(seatsLeft(null, 5), null);
  assert.equal(seatsLeft(100, 42), 58);
  assert.equal(seatsLeft(3, 5), 0);
});

test("relative time picks a sensible unit", () => {
  const now = new Date("2026-10-22T12:00:00Z");
  assert.equal(relativeTime(new Date("2026-10-22T11:30:00Z"), now), "30 minutes ago");
  assert.equal(relativeTime(new Date("2026-10-22T07:00:00Z"), now), "5 hours ago");
  assert.equal(relativeTime(new Date("2026-10-19T12:00:00Z"), now), "3 days ago");
  assert.equal(relativeTime(new Date("2026-10-24T12:00:00Z"), now), "in 2 days");
});
