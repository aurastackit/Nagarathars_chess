import { test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_SESSION_MAX_AGE_S, isSessionCurrent } from "./session-policy";

const NOW = Date.UTC(2026, 9, 22, 12, 0, 0);
const ctx = { now: NOW, version: "v1", lastLogoutAt: null };

test("a fresh session with the current version is accepted", () => {
  assert.equal(isSessionCurrent({ loginAt: NOW - 60_000, sv: "v1" }, ctx), true);
});

test("cookies issued before this change (no claims) are rejected", () => {
  assert.equal(isSessionCurrent({}, ctx), false);
});

test("a session older than 12 h is rejected", () => {
  const loginAt = NOW - ADMIN_SESSION_MAX_AGE_S * 1000 - 1;
  assert.equal(isSessionCurrent({ loginAt, sv: "v1" }, ctx), false);
});

test("rotating the credentials invalidates old sessions", () => {
  assert.equal(isSessionCurrent({ loginAt: NOW - 60_000, sv: "v0" }, ctx), false);
});

test("signing out invalidates every session issued before it, not later ones", () => {
  const after = { ...ctx, lastLogoutAt: NOW - 30_000 };
  assert.equal(isSessionCurrent({ loginAt: NOW - 60_000, sv: "v1" }, after), false);
  assert.equal(isSessionCurrent({ loginAt: NOW - 10_000, sv: "v1" }, after), true);
});
