// Read-only: counts rows written to one database after the copy's snapshot —
// on SOURCE (Sydney) after the switch, to prove nothing was written there late;
// or on TARGET (Mumbai) when planning a rollback. Exit code 2 if anything changed.
//   node scripts/db-move/delta.mjs [--on source|target] [--since 2026-10-23T19:30:00Z]
import fs from "node:fs";
import { connect, fail, insertOrder, label, loadMoveEnv, q } from "./lib.mjs";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const on = arg("--on") ?? "source";
let since = arg("--since");
if (!since && fs.existsSync("scripts/db-move/state/last-copy.json")) {
  since = JSON.parse(fs.readFileSync("scripts/db-move/state/last-copy.json", "utf8")).snapshotAt;
}
if (!since) fail("No --since given and no scripts/db-move/state/last-copy.json.");
const urls = loadMoveEnv();
const url = on === "target" ? urls.target : urls.source;
const db = connect(url);
console.log(`Rows on ${on.toUpperCase()} (${label(url)}) written after ${since}:`);

const TIME_COLUMNS = [
  "createdAt",
  "updatedAt",
  "registeredAt",
  "consumedAt",
  "reviewedAt",
  "withdrawnAt",
  "emailVerifiedAt",
];
let found = 0;
for (const t of await insertOrder(db)) {
  const cols = (
    await q(
      db,
      `select column_name from information_schema.columns
        where table_schema = 'public' and table_name = $1 and data_type like 'timestamp%'
          and column_name = any($2::text[])`,
      t,
      TIME_COLUMNS
    )
  ).map((r) => r.column_name);
  if (!cols.length) continue;
  const where = cols.map((c) => `"${c}" > $1::timestamptz`).join(" or ");
  const [{ n }] = await q(db, `select count(*)::int as n from "${t}" where ${where}`, since);
  if (n > 0) {
    found += n;
    console.log(`  ${t}: ${n} row(s) (checked ${cols.join(", ")})`);
  }
}
await db.$disconnect();
console.log(
  found ? `\n${found} row(s) changed after the copy.` : "\n✔ Nothing written after the copy."
);
process.exit(found ? 2 : 0);
