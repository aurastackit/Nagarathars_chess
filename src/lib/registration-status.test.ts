import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REGISTRATION_STATUSES,
  SEAT_HOLDING_STATUSES,
  fixByDate,
  assertTransition,
  canTransition,
  eventTypeFor,
  normalizeStatus,
  type RegistrationStatus,
  type StatusActor,
} from "./registration-status";

// Every allowed (from, to, actor); anything not listed must be refused.
const ALLOWED = new Set([
  "pending>confirmed>admin",
  "pending>rejected>admin",
  "pending>changes_requested>admin",
  "pending>withdrawn>admin",
  "pending>withdrawn>player",
  "rejected>pending>player",
  "rejected>confirmed>admin",
  "rejected>withdrawn>admin",
  "rejected>withdrawn>player",
  "changes_requested>pending>player",
  "changes_requested>confirmed>admin",
  "changes_requested>withdrawn>admin",
  "changes_requested>withdrawn>player",
  "confirmed>pending>admin",
  "confirmed>withdrawn>admin",
  "confirmed>withdrawn>player",
]);

test("the full transition table: exactly the allowed moves pass", () => {
  for (const from of REGISTRATION_STATUSES) {
    for (const to of REGISTRATION_STATUSES) {
      for (const actor of ["admin", "player"] as StatusActor[]) {
        const key = `${from}>${to}>${actor}`;
        assert.equal(canTransition(from, to, actor), ALLOWED.has(key), key);
      }
    }
  }
});

test("players can't approve, reject or re-open; admins can't 'edit' a rejection back to pending", () => {
  assert.equal(canTransition("pending", "confirmed", "player"), false);
  assert.equal(canTransition("rejected", "confirmed", "player"), false);
  assert.equal(canTransition("confirmed", "pending", "player"), false);
  assert.equal(canTransition("rejected", "pending", "admin"), false);
});

test("the system can only expire a changes request into a rejection", () => {
  for (const from of REGISTRATION_STATUSES) {
    for (const to of REGISTRATION_STATUSES) {
      const allowed = from === "changes_requested" && to === "rejected";
      assert.equal(canTransition(from, to, "system"), allowed, `${from}>${to}>system`);
    }
  }
});

test("changes_requested holds a seat for 7 days", () => {
  assert.deepEqual(SEAT_HOLDING_STATUSES, ["pending", "confirmed", "changes_requested"]);
  const requested = new Date("2026-11-01T10:00:00Z");
  assert.equal(fixByDate(requested).toISOString(), "2026-11-08T10:00:00.000Z");
});

test("withdrawn is final", () => {
  for (const to of REGISTRATION_STATUSES) {
    assert.equal(canTransition("withdrawn", to as RegistrationStatus, "admin"), false);
    assert.equal(canTransition("withdrawn", to as RegistrationStatus, "player"), false);
  }
});

test("legacy 'registered' behaves as confirmed", () => {
  assert.equal(normalizeStatus("registered"), "confirmed");
  assert.equal(canTransition("registered", "pending", "admin"), true);
  assert.equal(canTransition("registered", "confirmed", "admin"), false);
});

test("assertTransition throws a readable error", () => {
  assert.throws(
    () => assertTransition("withdrawn", "pending", "player"),
    /can't go from "withdrawn" to "pending"/
  );
  assert.doesNotThrow(() => assertTransition("pending", "confirmed", "admin"));
});

test("event types: player resubmission is 'edited', admin re-open is 'reopened'", () => {
  assert.equal(eventTypeFor("pending", "player"), "edited");
  assert.equal(eventTypeFor("pending", "admin"), "reopened");
  assert.equal(eventTypeFor("confirmed", "admin"), "confirmed");
  assert.equal(eventTypeFor("withdrawn", "player"), "withdrawn");
});
