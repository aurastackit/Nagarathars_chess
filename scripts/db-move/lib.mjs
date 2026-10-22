// Shared helpers for the Sydney → Mumbai database move. See scripts/db-move/README.md.
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

/** Connection strings come from .env.move in the project root (git-ignored), or the environment. */
export function loadMoveEnv() {
  if (fs.existsSync(".env.move")) process.loadEnvFile(".env.move");
  const missing = ["SOURCE_DATABASE_URL", "TARGET_DATABASE_URL"].filter((k) => !process.env[k]);
  if (missing.length) fail(`Missing ${missing.join(", ")} (put them in .env.move)`);
  const source = process.env.SOURCE_DATABASE_URL;
  const target = process.env.TARGET_DATABASE_URL;
  if (label(source) === label(target))
    fail("SOURCE and TARGET point at the same database — refusing.");
  return { source, target };
}

/** host:port/db, never the password. */
export function label(url) {
  const u = new URL(url);
  return `${u.hostname}:${u.port || 5432}${u.pathname}`;
}

export function connect(url) {
  return new PrismaClient({ datasourceUrl: url, log: [] });
}

export function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

export const q = (db, sql, ...args) => db.$queryRawUnsafe(sql, ...args);

/** Public tables we copy (Prisma's own migration history is created by `prisma migrate deploy`). */
export async function tables(db) {
  const rows = await q(
    db,
    `select c.relname as name, c.relrowsecurity as rls
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relname <> '_prisma_migrations'
      order by c.relname`
  );
  return rows.map((r) => ({ name: r.name, rls: r.rls }));
}

/** Tables ordered so every table comes after the tables its foreign keys point to. */
export async function insertOrder(db) {
  const names = (await tables(db)).map((t) => t.name);
  const deps = await q(
    db,
    `select c.relname as child, p.relname as parent
       from pg_constraint k
       join pg_class c on c.oid = k.conrelid
       join pg_class p on p.oid = k.confrelid
       join pg_namespace n on n.oid = c.relnamespace
      where k.contype = 'f' and n.nspname = 'public' and c.relname <> p.relname`
  );
  const ordered = [];
  const pending = new Set(names);
  while (pending.size) {
    const ready = [...pending].filter((t) =>
      deps.every((d) => d.child !== t || !pending.has(d.parent))
    );
    if (!ready.length) fail(`Circular foreign keys between: ${[...pending].join(", ")}`);
    for (const t of ready.sort()) {
      ordered.push(t);
      pending.delete(t);
    }
  }
  return ordered;
}

/** Row count and an md5 over every row's JSON, in id order — equal on both sides means identical data. */
export async function fingerprint(db, table) {
  const [{ n, h }] = await q(
    db,
    `select count(*)::int as n,
            coalesce(md5(string_agg(row_to_json(t)::text, chr(10) order by t."id")), 'empty') as h
       from "${table}" t`
  );
  return { rows: n, md5: h };
}

export async function appliedMigrations(db) {
  const rows = await q(
    db,
    `select migration_name from "_prisma_migrations"
      where finished_at is not null and rolled_back_at is null order by migration_name`
  ).catch(() => []);
  return rows.map((r) => r.migration_name);
}

export async function serverInfo(db) {
  const [{ v, now }] = await q(db, `select split_part(version(), ',', 1) as v, now() as now`);
  return { version: v, now };
}
