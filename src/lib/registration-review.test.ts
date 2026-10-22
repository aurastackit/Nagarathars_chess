import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACTION_TARGET,
  REASON_TEMPLATES,
  actionLabel,
  adminActionsFor,
  ageCheck,
  pendingNeighbours,
} from "./registration-review";
import { canTransition, REGISTRATION_STATUSES } from "./registration-status";
import { changesRequestedEmail, decisionEmail } from "./registration-emails";

test("actions offered for each status are exactly the admin transitions the server allows", () => {
  assert.deepEqual(adminActionsFor("pending"), ["approve", "changes", "reject", "withdraw"]);
  assert.deepEqual(adminActionsFor("confirmed"), ["reopen", "withdraw"]);
  assert.deepEqual(adminActionsFor("rejected"), ["approve", "withdraw"]);
  assert.deepEqual(adminActionsFor("changes_requested"), ["approve", "withdraw"]);
  assert.deepEqual(adminActionsFor("withdrawn"), []);
  assert.deepEqual(adminActionsFor("registered"), ["reopen", "withdraw"]);
  for (const status of REGISTRATION_STATUSES) {
    for (const action of adminActionsFor(status)) {
      assert.ok(canTransition(status, ACTION_TARGET[action], "admin"), `${status} → ${action}`);
    }
  }
  assert.equal(actionLabel("approve", "pending"), "Approve");
  assert.equal(actionLabel("approve", "rejected"), "Re-open and approve");
});

test("every reason template is long enough to send", () => {
  for (const list of Object.values(REASON_TEMPLATES)) {
    assert.ok(list.length >= 3);
    for (const t of list) assert.ok(t.length >= 5 && t.length <= 500, t);
  }
});

test("age check: category from the birth year in the tournament year", () => {
  const start = new Date("2026-12-27T00:00:00Z");
  const ok = ageCheck(new Date(Date.UTC(2017, 0, 1)), start, "under_11");
  assert.equal(ok?.age, 9);
  assert.equal(ok?.matches, true);
  assert.equal(ok?.message, null);
  const off = ageCheck(new Date(Date.UTC(2005, 0, 1)), start, "11_to_18");
  assert.equal(off?.matches, false);
  assert.equal(off?.expected, "above_19");
  assert.match(
    off!.message!,
    /Born 2005, so 21 in 2026: that's Above 19, but the registration is Under 19/
  );
  assert.equal(ageCheck(null, start, "under_11"), null);
});

test("pending queue: neighbours in submission order, also from a non-pending registration", () => {
  const d = (n: number) => new Date(Date.UTC(2026, 9, n));
  const pending = [
    { id: "c", registeredAt: d(3) },
    { id: "a", registeredAt: d(1) },
    { id: "e", registeredAt: d(5) },
  ];
  assert.deepEqual(pendingNeighbours(pending, { id: "c", registeredAt: d(3) }), {
    prevId: "a",
    nextId: "e",
    position: 2,
    total: 3,
  });
  assert.deepEqual(pendingNeighbours(pending, { id: "a", registeredAt: d(1) }), {
    prevId: null,
    nextId: "c",
    position: 1,
    total: 3,
  });
  // Just approved (no longer pending): carries on to the next one in the queue.
  assert.deepEqual(pendingNeighbours(pending, { id: "b", registeredAt: d(2) }), {
    prevId: "a",
    nextId: "c",
    position: null,
    total: 3,
  });
  // Same timestamp: ordered by id.
  const same = [
    { id: "x", registeredAt: d(1) },
    { id: "y", registeredAt: d(1) },
  ];
  assert.equal(pendingNeighbours(same, { id: "x", registeredAt: d(1) }).nextId, "y");
});

test("emails escape what admins and players typed", () => {
  const base = { fullName: "<b>Ravi</b>", registrationId: "r1", tournamentTitle: "Open & Rapid" };
  const rejected = decisionEmail({
    ...base,
    decision: "rejected",
    reason: '<script>alert("x")</script>',
  });
  assert.ok(!rejected.html.includes("<script>"));
  assert.ok(rejected.html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"));
  assert.ok(rejected.html.includes("&lt;b&gt;Ravi&lt;/b&gt;"));
  assert.ok(rejected.html.includes("Open &amp; Rapid"));
  assert.equal(rejected.subject, "Update on your registration for Open & Rapid");
  const confirmed = decisionEmail({ ...base, decision: "confirmed" });
  assert.equal(confirmed.subject, "Confirmed: Open & Rapid");
  const changes = changesRequestedEmail({
    ...base,
    reason: "Photo <unclear>",
    fixBy: new Date("2026-10-30T06:30:00Z"),
  });
  assert.match(changes.subject, /^Action needed by 30 Oct 2026, 12:00 pm: Open & Rapid$/);
  assert.ok(changes.html.includes("Photo &lt;unclear&gt;"));
});
