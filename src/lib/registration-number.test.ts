import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatRegistrationNo,
  nextRegistrationNo,
  yearInIST,
  type RegistrationSeqClient,
} from "./registration-number";

const START = new Date("2026-12-27T00:00:00Z");

test("format: NCC{YY}-{CAT}-{NNNN}", () => {
  assert.equal(
    formatRegistrationNo({ startDate: START, ageCategory: "under_11", seq: 42 }),
    "NCC26-U11-0042"
  );
  assert.equal(
    formatRegistrationNo({ startDate: START, ageCategory: "11_to_18", seq: 1 }),
    "NCC26-U19-0001"
  );
  assert.equal(
    formatRegistrationNo({ startDate: START, ageCategory: "above_19", seq: 9999 }),
    "NCC26-A19-9999"
  );
});

test("format: unknown category and numbers past 9999", () => {
  assert.equal(
    formatRegistrationNo({ startDate: START, ageCategory: null, seq: 7 }),
    "NCC26-GEN-0007"
  );
  assert.equal(
    formatRegistrationNo({ startDate: START, ageCategory: "under_11", seq: 12345 }),
    "NCC26-U11-12345"
  );
});

test("the year is India time: 31 Dec 20:00 UTC is already the next year in IST", () => {
  assert.equal(yearInIST(new Date("2026-12-31T20:00:00Z")), 2027);
  assert.equal(
    formatRegistrationNo({
      startDate: new Date("2026-12-31T20:00:00Z"),
      ageCategory: "under_11",
      seq: 1,
    }),
    "NCC27-U11-0001"
  );
});

/**
 * Fake tournament row with Postgres-like behaviour: each UPDATE … increment
 * waits for the row lock, then reads and writes atomically. Random delays
 * interleave the callers the way concurrent requests would.
 */
function fakeTournamentRow(seq = 0): RegistrationSeqClient & { calls: number } {
  let lock: Promise<void> = Promise.resolve();
  const row = { registrationSeq: seq, startDate: START };
  const client = {
    calls: 0,
    tournament: {
      async update() {
        client.calls++;
        await new Promise((r) => setTimeout(r, Math.random() * 5));
        const prev = lock;
        let release!: () => void;
        lock = new Promise((r) => (release = r));
        await prev;
        try {
          await new Promise((r) => setTimeout(r, Math.random() * 3));
          row.registrationSeq += 1;
          return { registrationSeq: row.registrationSeq, startDate: row.startDate };
        } finally {
          release();
        }
      },
    },
  };
  return client;
}

test("concurrency: 200 simultaneous submissions get 200 distinct, gap-free numbers", async () => {
  const tx = fakeTournamentRow(41);
  const categories = ["under_11", "11_to_18", "above_19"];
  const numbers = await Promise.all(
    Array.from({ length: 200 }, (_, i) => nextRegistrationNo(tx, "t1", categories[i % 3]))
  );
  assert.equal(new Set(numbers).size, 200);
  const seqs = numbers.map((n) => Number(n.split("-")[2])).sort((a, b) => a - b);
  assert.deepEqual(
    seqs,
    Array.from({ length: 200 }, (_, i) => 42 + i)
  );
  assert.equal(tx.calls, 200, "one atomic increment per submission, no separate read");
});
