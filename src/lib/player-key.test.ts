import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail, playerKey } from "./player-key";
import { parseResultsCsv, playerResolver } from "./results-csv";

test("a player is email + name + year of birth; capitals and spaces don't matter", () => {
  const dob = new Date(Date.UTC(2014, 0, 1));
  const a = playerKey({ email: " Parent@Example.COM ", fullName: "  Meena   Kannan ", dob });
  assert.deepEqual(a, { email: "parent@example.com", nameKey: "meena kannan", birthYear: 2014 });
  assert.deepEqual(playerKey({ email: "parent@example.com", fullName: "MEENA KANNAN", dob }), a);
  // Siblings under one email are different players.
  assert.notDeepEqual(playerKey({ email: "parent@example.com", fullName: "Arun Kannan", dob }), a);
  assert.notDeepEqual(
    playerKey({
      email: "parent@example.com",
      fullName: "Meena Kannan",
      dob: new Date(Date.UTC(2016, 0, 1)),
    }),
    a
  );
  // The old form stored a full date: the same year is the same player.
  assert.equal(
    playerKey({ email: "x@y.in", fullName: "A", dob: new Date("1972-09-30T00:00:00Z") }).birthYear,
    1972
  );
  assert.equal(playerKey({ email: "x@y.in", fullName: "A" }).birthYear, null);
  assert.equal(playerKey({ email: "x@y.in", fullName: "QA  தந்தை" }).nameKey, "qa தந்தை");
  assert.equal(normalizeEmail("\tMuthu@Gmail.com "), "muthu@gmail.com");
});

test("pairings import: registration numbers, or an email that's one player's only", () => {
  const resolve = playerResolver([
    { email: "parent@example.com", registrationNo: "NCC27-U11-0001", playerId: "p1" },
    { email: "parent@example.com", registrationNo: "NCC27-U19-0002", playerId: "p2" },
    { email: "Solo@Example.com", registrationNo: "NCC27-A19-0003", playerId: "p3" },
  ]);
  assert.deepEqual(resolve("ncc27-u19-0002"), { playerId: "p2" });
  assert.deepEqual(resolve(" solo@example.com "), { playerId: "p3" });
  assert.match(
    (resolve("parent@example.com") as { error: string }).error,
    /shared by 2 players — use their registration numbers/
  );
  assert.match(
    (resolve("nobody@example.com") as { error: string }).error,
    /no confirmed registrant/
  );

  const { rows, errors } = parseResultsCsv(
    "round,board,white_email,black_email,result\n1,1,NCC27-U11-0001,NCC27-U19-0002,1-0\n1,2,solo@example.com,,BYE"
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(
    rows.map((r) => [r.white, r.black]),
    [
      ["NCC27-U11-0001", "NCC27-U19-0002"],
      ["solo@example.com", null],
    ]
  );
});
