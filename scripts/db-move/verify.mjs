// Read-only: compares every public table on SOURCE and TARGET (row count + md5
// of all rows), plus migrations, row-level security and registration counters.
// Exit code 1 on any difference.
//   node scripts/db-move/verify.mjs
import {
  appliedMigrations,
  connect,
  fingerprint,
  insertOrder,
  loadMoveEnv,
  tables,
} from "./lib.mjs";

const { source, target } = loadMoveEnv();
const src = connect(source);
const dst = connect(target);
let ok = true;

console.log(`${"table".padEnd(23)} ${"SOURCE".padStart(8)} ${"TARGET".padStart(8)}   data`);
for (const t of await insertOrder(src)) {
  const [a, b] = await Promise.all([fingerprint(src, t), fingerprint(dst, t)]);
  const same = a.rows === b.rows && a.md5 === b.md5;
  ok &&= same;
  console.log(
    `${t.padEnd(23)} ${String(a.rows).padStart(8)} ${String(b.rows).padStart(8)}   ${same ? "✔ identical" : "✖ DIFFERENT"}`
  );
}

const [sm, dm] = await Promise.all([appliedMigrations(src), appliedMigrations(dst)]);
const migOk = sm.join(",") === dm.join(",");
ok &&= migOk;
console.log(`\nmigrations: ${migOk ? "✔ same" : "✖ different"} (${sm.length} / ${dm.length})`);

const rlsOff = (await tables(dst)).filter((t) => !t.rls).map((t) => t.name);
ok &&= rlsOff.length === 0;
console.log(
  `row-level security on TARGET: ${rlsOff.length ? `✖ off on ${rlsOff.join(", ")}` : "✔ on for every table"}`
);

const counters = await Promise.all(
  [src, dst].map((db) =>
    db.$queryRawUnsafe(`select slug, "registrationSeq" from "Tournament" order by slug`)
  )
);
const counterOk = JSON.stringify(counters[0]) === JSON.stringify(counters[1]);
ok &&= counterOk;
console.log(`registration number counters: ${counterOk ? "✔ same" : "✖ different"}`);

await Promise.all([src.$disconnect(), dst.$disconnect()]);
console.log(
  ok ? "\n✔ TARGET is an exact copy of SOURCE." : "\n✖ Differences found — do NOT switch over."
);
process.exit(ok ? 0 : 1);
