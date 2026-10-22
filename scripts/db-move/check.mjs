// Read-only pre-flight for both databases. Changes nothing.
//   node scripts/db-move/check.mjs
import {
  appliedMigrations,
  connect,
  fingerprint,
  label,
  loadMoveEnv,
  serverInfo,
  tables,
} from "./lib.mjs";

const { source, target } = loadMoveEnv();
const src = connect(source);
const dst = connect(target);
const problems = [];

for (const [name, db, url] of [
  ["SOURCE", src, source],
  ["TARGET", dst, target],
]) {
  const info = await serverInfo(db);
  console.log(`${name}: ${label(url)} — ${info.version}`);
}

const [srcTables, dstTables] = await Promise.all([tables(src), tables(dst)]);
const dstNames = new Set(dstTables.map((t) => t.name));
if (srcTables.map((t) => t.name).join(",") !== dstTables.map((t) => t.name).join(",")) {
  problems.push("Table lists differ — run `prisma migrate deploy` on TARGET first.");
}
for (const t of dstTables)
  if (!t.rls) problems.push(`Row-level security is OFF on TARGET table ${t.name}`);

const [srcMig, dstMig] = await Promise.all([appliedMigrations(src), appliedMigrations(dst)]);
if (srcMig.join(",") !== dstMig.join(",")) {
  problems.push(`Migrations differ (SOURCE ${srcMig.length}, TARGET ${dstMig.length}).`);
}

console.log(`\n${"table".padEnd(23)} ${"SOURCE rows".padStart(12)} ${"TARGET rows".padStart(12)}`);
for (const t of srcTables) {
  const [a, b] = await Promise.all([
    fingerprint(src, t.name),
    dstNames.has(t.name) ? fingerprint(dst, t.name) : { rows: "—" },
  ]);
  console.log(`${t.name.padEnd(23)} ${String(a.rows).padStart(12)} ${String(b.rows).padStart(12)}`);
}

await Promise.all([src.$disconnect(), dst.$disconnect()]);
if (problems.length) {
  console.log("\nProblems:\n  - " + problems.join("\n  - "));
  process.exit(1);
}
console.log("\n✔ Schemas, migrations and row-level security match. Ready to copy.");
