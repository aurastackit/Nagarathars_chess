# Moving the database from Sydney to Mumbai

Supabase can't change a project's region, so we create a new project in Mumbai
(`ap-south-1`), copy the data across, and point the site at it. The site stays
readable throughout; only writes (registration, forms, admin changes) pause, for
about 15–20 minutes.

**What moves:** only the Postgres database (Postgres 17, ~11 MB, 15 tables). We
don't use Supabase Storage or Supabase Auth, and no stored URL points at Supabase.

## The scripts

All four read connection strings from `.env.move` in the project root
(git-ignored — `.env*` is in `.gitignore`):

```
SOURCE_DATABASE_URL=<Sydney, the current DIRECT_URL>
TARGET_DATABASE_URL=<Mumbai, the session pooler on port 5432>
```

| Script                                       | Writes?         | What it does                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/db-move/check.mjs`             | no              | Both databases reachable; same tables, migrations and row-level security; row counts side by side.                                                                                                                                                                                                               |
| `node scripts/db-move/copy.mjs --confirm`    | **TARGET only** | Reads SOURCE in one read-only snapshot, writes TARGET in one transaction (all or nothing), parents before children. Refuses if TARGET already has data (add `--truncate-target` to replace it) or if SOURCE and TARGET are the same database. Saves the snapshot time to `scripts/db-move/state/last-copy.json`. |
| `node scripts/db-move/verify.mjs`            | no              | Every table: row count **and** an md5 of all rows must match; migrations, row-level security and registration-number counters too. Exit code 1 on any difference.                                                                                                                                                |
| `node scripts/db-move/delta.mjs --on source` | no              | Rows written after the copy's snapshot (by their createdAt / updatedAt / registeredAt / … columns). Use `--on target` when planning a rollback. Exit code 2 if anything changed.                                                                                                                                 |

They were rehearsed on two local Postgres 17 databases with Tamil text, quotes,
newlines, emoji, enums, nulls and every foreign key: the copy was byte-identical,
a single changed character made `verify` fail, a late write showed up in `delta`,
and both safety refusals worked.

## Before the day

1. **Amplify region.** Amplify console URL → the region (e.g. `ap-south-1`). The
   gain assumes the site runs in Mumbai like the S3 bucket.
2. **Supabase free plan: 2 active projects per organization.** Paused projects
   don't count. If the organization already has two active projects, pause one
   first. Note: free projects pause after a week without activity — fine for the
   old Sydney project afterwards (restorable for 90 days); the live one is always active.
3. **Create the Mumbai project:** Supabase → New project → Region **South Asia
   (Mumbai)**, a new strong database password (password manager). Postgres 17
   (the default). Wait until it's healthy.
4. **Copy its connection strings** (Project → Connect):
   - Transaction pooler, port **6543** → future `DATABASE_URL`; append `?pgbouncer=true` (as today).
   - Session pooler, port **5432** → future `DIRECT_URL` and `TARGET_DATABASE_URL`.
     (Use the pooler, not `db.<ref>.supabase.co`, which is IPv6-only on new projects.)
5. **Create the schema on Mumbai** (empty tables, migration history, row-level security):
   ```
   DATABASE_URL="<Mumbai session pooler>" DIRECT_URL="<Mumbai session pooler>" npx prisma migrate deploy
   ```
6. **Fill in `.env.move`** and run `node scripts/db-move/check.mjs` → expect
   "✔ … Ready to copy" with TARGET rows all 0.
7. **Rehearsal (optional, reads Sydney only):** `copy.mjs --confirm`, then
   `verify.mjs` → all identical. Then `copy.mjs --confirm --truncate-target` on
   the day replaces it. The site is untouched by a rehearsal.

## Cutover (suggested 01:00 IST, ~20 minutes)

| #   | Who | Step                                                                                                                                                                                                     | Expect                                                              |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | You | Amplify → Environment variables: `READ_ONLY_MODE` = `true`. Redeploy master.                                                                                                                             | Build log line `amplify.yml from repo v3 - … READ_ONLY_MODE - true` |
| 2   | Me  | Check live: bar says "Site upgrade in progress…", `POST /api/contact` → 503.                                                                                                                             | Writes refused, pages fine                                          |
| 3   | Me  | `node scripts/db-move/check.mjs`                                                                                                                                                                         | "Ready to copy"                                                     |
| 4   | Me  | `node scripts/db-move/copy.mjs --confirm --truncate-target`                                                                                                                                              | "✔ Copied" (seconds)                                                |
| 5   | Me  | `node scripts/db-move/verify.mjs`                                                                                                                                                                        | "✔ TARGET is an exact copy" — **stop here if not**                  |
| 6   | You | Amplify → `DATABASE_URL` = Mumbai transaction pooler (6543, `?pgbouncer=true`), `DIRECT_URL` = Mumbai session pooler (5432), `READ_ONLY_MODE` = `false`. Redeploy master.                                | Build passes; `prisma migrate deploy` says no pending migrations    |
| 7   | Me  | Once live: `node scripts/db-move/delta.mjs --on source`                                                                                                                                                  | "✔ Nothing written after the copy" (Sydney untouched)               |
| 8   | Me  | Smoke test: home/tournaments/tournament/results load and timings; admin sign-in; a QA registration to `success@simulator.amazonses.com` (then deleted); sign-in code; upload presign; exports; daily job | All OK, pages ~0.3–0.5 s                                            |
| 9   | Me  | Update the local `.env` (`DATABASE_URL`, `DIRECT_URL`) to Mumbai.                                                                                                                                        |                                                                     |
| 10  | You | Leave the Sydney project alone for 14 days, then delete it.                                                                                                                                              |                                                                     |

Only `DATABASE_URL` and `DIRECT_URL` change (Amplify + local `.env`). GitHub
Actions, S3, SES and everything else stay as they are.

## Rollback

- **Before step 6:** nothing has changed for the site — set `READ_ONLY_MODE=false`, redeploy.
- **After step 6:** set `DATABASE_URL` / `DIRECT_URL` back to Sydney and redeploy
  (~5 minutes; turn `READ_ONLY_MODE=true` on in the same redeploy if Mumbai took
  writes). Then `node scripts/db-move/delta.mjs --on target` lists what was written
  in Mumbai since the copy; those rows are copied back before reopening writes.
