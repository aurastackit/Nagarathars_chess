// Copies every public table SOURCE → TARGET. Reads SOURCE in one read-only
// snapshot; writes TARGET in one transaction (all or nothing). Never writes SOURCE.
//   node scripts/db-move/copy.mjs --confirm [--truncate-target]
import fs from "node:fs";
import {
  connect,
  fail,
  fingerprint,
  insertOrder,
  label,
  loadMoveEnv,
  q,
  serverInfo,
  tables,
} from "./lib.mjs";

if (!process.argv.includes("--confirm"))
  fail("Add --confirm to copy (this writes to TARGET only).");
const truncate = process.argv.includes("--truncate-target");
const { source, target } = loadMoveEnv();
const src = connect(source);
const dst = connect(target);
console.log(`SOURCE ${label(source)}  →  TARGET ${label(target)}`);

const order = await insertOrder(src);
const dstNames = new Set((await tables(dst)).map((t) => t.name));
for (const t of order) {
  if (!dstNames.has(t))
    fail(`TARGET has no table ${t} — run \`prisma migrate deploy\` on TARGET first.`);
}
if (!truncate) {
  for (const t of order) {
    const { rows } = await fingerprint(dst, t);
    if (rows > 0) {
      fail(
        `TARGET table ${t} already has ${rows} row(s). Use --truncate-target to replace TARGET's data.`
      );
    }
  }
}

// 1. One consistent snapshot of SOURCE: nothing can change between tables.
const snapshot = {};
const { now: snapshotAt } = await serverInfo(src);
await src.$transaction(
  async (tx) => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    for (const t of order) {
      const [{ rows }] = await q(
        tx,
        `select coalesce(json_agg(t), '[]'::json) as rows from "${t}" t`
      );
      snapshot[t] = rows;
    }
  },
  { isolationLevel: "RepeatableRead", timeout: 300_000, maxWait: 30_000 }
);
const total = Object.values(snapshot).reduce((a, r) => a + r.length, 0);
console.log(
  `Read ${total} rows from ${order.length} tables (snapshot ${new Date(snapshotAt).toISOString()}).`
);

// 2. Write TARGET in one transaction, parents before children. Postgres turns
//    its own JSON back into rows, so dates, enums and text round-trip exactly.
await dst.$transaction(
  async (tx) => {
    if (truncate)
      await tx.$executeRawUnsafe(`TRUNCATE ${order.map((t) => `"${t}"`).join(", ")} CASCADE`);
    for (const t of order) {
      const rows = snapshot[t];
      for (let i = 0; i < rows.length; i += 500) {
        await tx.$executeRawUnsafe(
          `insert into "${t}" select * from json_populate_recordset(null::"${t}", $1::json)`,
          JSON.stringify(rows.slice(i, i + 500))
        );
      }
      console.log(`  ${t.padEnd(22)} ${String(rows.length).padStart(6)} rows`);
    }
  },
  { timeout: 300_000, maxWait: 30_000 }
);

fs.mkdirSync("scripts/db-move/state", { recursive: true });
fs.writeFileSync(
  "scripts/db-move/state/last-copy.json",
  JSON.stringify(
    {
      snapshotAt: new Date(snapshotAt).toISOString(),
      source: label(source),
      target: label(target),
      rows: total,
    },
    null,
    2
  )
);
await Promise.all([src.$disconnect(), dst.$disconnect()]);
console.log("\n✔ Copied. Now run: node scripts/db-move/verify.mjs");
