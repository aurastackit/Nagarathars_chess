<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rules

- Local `.env` points at the **production** Supabase database. Never run `prisma migrate dev`,
  `prisma migrate reset`, or `prisma db push` — all three can write to or drop data on the live
  database. Create migrations only with:
  ```
  npx prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script
  ```
  (read-only — it diffs and prints SQL, it does not apply anything) and save the output as a new
  `prisma/migrations/<timestamp>_<name>/migration.sql` folder. Amplify applies migrations on
  deploy with `prisma migrate deploy`.
- Every migration that creates a table must also enable Row Level Security on it
  (`ALTER TABLE "public"."TableName" ENABLE ROW LEVEL SECURITY;`).
- Every new server env var must be added to the keys list in `amplify.yml`'s env-runtime step,
  or it will be empty at runtime on Amplify.
- Run `npm run check` before saying a task is done.
