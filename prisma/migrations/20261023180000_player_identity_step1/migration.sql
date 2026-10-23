-- Player identity, step 1 of 2: a player is the email they registered with +
-- their name + their year of birth, so children registered with a parent's email
-- can each have their own profile. Step 2 drops the old one-player-per-email rule.
-- Generated with `prisma migrate diff`, then edited by hand to normalise and backfill.
-- Safe while the previous code is still live: new nullable columns and a new index
-- only; the email-only index it relies on stays until step 2.

-- 1. New columns.
ALTER TABLE "Player" ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "nameKey" TEXT;

-- 2. Emails are compared lower-cased and trimmed. None needed it on 23 Oct 2026;
--    this catches anything written since.
UPDATE "Player" SET "email" = lower(btrim("email")) WHERE "email" <> lower(btrim("email"));
UPDATE "Registration" SET "email" = lower(btrim("email")) WHERE "email" <> lower(btrim("email"));

-- 3. Backfill: the name lower-cased with single spaces (as src/lib/player.ts does),
--    the year from the date of birth.
UPDATE "Player"
SET "nameKey"   = lower(btrim(regexp_replace("fullName", '\s+', ' ', 'g'))),
    "birthYear" = EXTRACT(YEAR FROM "dob")::int;

-- 4. The new identity.
CREATE UNIQUE INDEX "Player_email_nameKey_birthYear_key" ON "Player"("email", "nameKey", "birthYear");
