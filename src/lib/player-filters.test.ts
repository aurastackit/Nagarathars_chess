import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FILTERS,
  findDuplicates,
  istDateRange,
  nextSort,
  normalisePhone,
  parsePlayerFilters,
  playerFiltersQuery,
} from "./player-filters";

test("parsing keeps valid values and drops invalid ones", () => {
  const f = parsePlayerFilters(
    new URLSearchParams(
      "t=abc&status=confirmed&gender=female&from=2026-10-01&to=bad&sort=fullName&dir=asc&page=3&per=50&dup=1&q=  muthu "
    )
  );
  assert.equal(f.t, "abc");
  assert.equal(f.status, "confirmed");
  assert.equal(f.gender, "female");
  assert.equal(f.from, "2026-10-01");
  assert.equal(f.to, "");
  assert.equal(f.sort, "fullName");
  assert.equal(f.dir, "asc");
  assert.equal(f.page, 3);
  assert.equal(f.per, 50);
  assert.equal(f.dup, true);
  assert.equal(f.q, "muthu");
});

test("junk falls back to defaults", () => {
  const f = parsePlayerFilters({
    status: "hacked",
    sort: "password",
    per: "1000",
    page: "-2",
    dc: "maybe",
  });
  assert.deepEqual(f, DEFAULT_FILTERS);
});

test("the query string leaves out defaults and round-trips", () => {
  assert.equal(playerFiltersQuery({}), "");
  const q = playerFiltersQuery({ status: "pending", page: 2, dup: true });
  assert.equal(q, "status=pending&dup=1&page=2");
  assert.deepEqual(parsePlayerFilters(new URLSearchParams(q)), {
    ...DEFAULT_FILTERS,
    status: "pending",
    page: 2,
    dup: true,
  });
});

test("sorting: same column flips, a new column starts in its natural direction", () => {
  assert.deepEqual(nextSort(DEFAULT_FILTERS, "registeredAt"), { sort: "registeredAt", dir: "asc" });
  assert.deepEqual(nextSort(DEFAULT_FILTERS, "fullName"), { sort: "fullName", dir: "asc" });
  assert.deepEqual(nextSort({ ...DEFAULT_FILTERS, sort: "fullName", dir: "asc" }, "fullName"), {
    sort: "fullName",
    dir: "desc",
  });
});

test("date range is inclusive, in IST", () => {
  const { start, end } = istDateRange("2026-10-01", "2026-10-02");
  assert.equal(start?.toISOString(), "2026-09-30T18:30:00.000Z");
  assert.equal(end?.toISOString(), "2026-10-02T18:30:00.000Z");
  assert.deepEqual(istDateRange("", ""), { start: undefined, end: undefined });
});

test("phones compare on their last 10 digits", () => {
  assert.equal(normalisePhone("+91 98765-43210"), "9876543210");
  assert.equal(normalisePhone("09876543210"), "9876543210");
});

test("duplicates: same phone or email within a tournament, never across tournaments", () => {
  const rows = [
    {
      id: "a",
      tournamentId: "t1",
      phone: "+91 98765 43210",
      email: "A@x.com",
      registrationNo: "N-1",
    },
    { id: "b", tournamentId: "t1", phone: "9876543210", email: "b@x.com", registrationNo: "N-2" },
    { id: "c", tournamentId: "t1", phone: "9000000000", email: "a@x.com", registrationNo: "N-3" },
    { id: "d", tournamentId: "t2", phone: "9876543210", email: "a@x.com", registrationNo: "M-1" },
    { id: "e", tournamentId: "t1", phone: "9111111111", email: "e@x.com", registrationNo: "N-4" },
  ];
  const d = findDuplicates(rows);
  assert.deepEqual(d.get("a"), { phone: ["N-2"], email: ["N-3"] });
  assert.deepEqual(d.get("b"), { phone: ["N-1"], email: [] });
  assert.deepEqual(d.get("c"), { phone: [], email: ["N-1"] });
  assert.equal(d.has("d"), false);
  assert.equal(d.has("e"), false);
});
