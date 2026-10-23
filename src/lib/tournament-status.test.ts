import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LISTED_STATUSES,
  canRegisterFor,
  isRegistrableStatus,
  isUnlisted,
} from "./tournament-status";
import { TOURNAMENT_STATUSES } from "./tournament-form";

test("unlisted (test) tournaments: open by direct link, never listed", () => {
  const now = new Date("2026-10-23T06:00:00Z");
  const dates = {
    endDate: new Date("2026-12-27T00:00:00Z"),
    registrationDeadline: new Date("2026-12-20T00:00:00Z"),
  };
  assert.ok(canRegisterFor({ ...dates, status: "unlisted" }, now), "registration works");
  assert.ok(canRegisterFor({ ...dates, status: "published" }, now));
  for (const s of ["draft", "closed", "completed"]) {
    assert.ok(!canRegisterFor({ ...dates, status: s }, now), s);
  }
  assert.ok(
    !canRegisterFor({ ...dates, status: "unlisted" }, new Date("2026-12-21T00:00:00Z")),
    "deadline still applies"
  );
  assert.ok(isRegistrableStatus("unlisted") && isUnlisted("unlisted") && !isUnlisted("published"));
  assert.ok(!LISTED_STATUSES.includes("unlisted") && !LISTED_STATUSES.includes("draft"));
  assert.deepEqual(LISTED_STATUSES, ["published", "closed", "completed"]);
  assert.ok((TOURNAMENT_STATUSES as readonly string[]).includes("unlisted"), "admins can pick it");
});
