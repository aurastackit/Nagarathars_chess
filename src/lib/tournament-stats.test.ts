import { test } from "node:test";
import assert from "node:assert/strict";
import { getTournamentStats } from "./tournament-stats";

const day = (s: string) => new Date(`${s}T00:00:00Z`);

test("tournament stats: one past and one upcoming", () => {
  const now = new Date("2026-10-24T06:00:00Z");
  const past = {
    city: "Chennai",
    startDate: day("2026-09-01"),
    endDate: day("2026-09-01"),
    registrationDeadline: day("2026-08-25"),
  };
  const upcoming = {
    city: "Madurai",
    startDate: day("2026-12-27"),
    endDate: day("2026-12-27"),
    registrationDeadline: day("2026-12-20"),
  };
  assert.deepEqual(getTournamentStats([past, upcoming], now), {
    hosted: 1,
    cities: 1,
    completed: 1,
  });
  // Starting today counts as hosted. (getTournamentStatus calls a one-day event completed from
  // the start of its day, because endDate is midnight UTC — noted in TODO.md.)
  const today = { ...upcoming, startDate: day("2026-10-24"), endDate: day("2026-10-24") };
  assert.equal(getTournamentStats([today], now).hosted, 1);
  assert.deepEqual(getTournamentStats([], now), { hosted: 0, cities: 0, completed: 0 });
});
