import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE_DELAY_MS, MAX_DELAY_MS, WINDOW_MS, lockoutRemainingMs, type LoginAttempt } from "./login-throttle";

const NOW = Date.UTC(2026, 9, 22, 12, 0, 0);
const fail = (msAgo: number): LoginAttempt => ({ at: new Date(NOW - msAgo), ok: false });
const ok = (msAgo: number): LoginAttempt => ({ at: new Date(NOW - msAgo), ok: true });

test("the first four failures never lock", () => {
  assert.equal(lockoutRemainingMs([fail(1000), fail(2000), fail(3000), fail(4000)], NOW), 0);
});

test("the fifth failure starts a 30 s wait, measured from the last failure", () => {
  const attempts = [fail(1000), fail(2000), fail(3000), fail(4000), fail(5000)];
  assert.equal(lockoutRemainingMs(attempts, NOW), BASE_DELAY_MS - 1000);
});

test("each further failure doubles the wait, capped at 30 min", () => {
  const seven = Array.from({ length: 7 }, (_, i) => fail(i + 1));
  assert.equal(lockoutRemainingMs(seven, NOW), BASE_DELAY_MS * 4 - 1);
  const many = Array.from({ length: 40 }, (_, i) => fail(i + 1));
  assert.equal(lockoutRemainingMs(many, NOW), MAX_DELAY_MS - 1);
});

test("a successful sign-in resets the count", () => {
  const attempts = [fail(1000), ok(2000), fail(3000), fail(4000), fail(5000), fail(6000), fail(7000)];
  assert.equal(lockoutRemainingMs(attempts, NOW), 0);
});

test("failures older than the window are ignored", () => {
  const old = Array.from({ length: 10 }, (_, i) => fail(WINDOW_MS + i + 1));
  assert.equal(lockoutRemainingMs(old, NOW), 0);
});
