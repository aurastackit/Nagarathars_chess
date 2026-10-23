-- Player identity, step 2 of 2: one email may now hold several players (a
-- parent's children each get their own profile). Drops the old
-- one-player-per-email index and gives every registration its own person's
-- profile. Generated with `prisma migrate diff`, then edited by hand for the
-- safety check and the data steps.
-- Safe while the step-1 code is live: it no longer relies on the email-only index.

-- 1. Stop if a profile shared by two people already has games (would need a manual split).
DO $$ BEGIN
  IF EXISTS (
    SELECT r."playerId" FROM "Registration" r
    WHERE r."playerId" IN (SELECT "whitePlayerId" FROM "Pairing" UNION SELECT "blackPlayerId" FROM "Pairing")
    GROUP BY r."playerId"
    HAVING count(DISTINCT lower(btrim(regexp_replace(r."fullName", '\s+', ' ', 'g')))
                 || '|' || coalesce(EXTRACT(YEAR FROM r."dob")::text, '')) > 1
  ) THEN RAISE EXCEPTION 'A shared player profile already has games: split it by hand first';
  END IF;
END $$;

-- 2. The old rule.
DROP INDEX "Player_email_key";

-- 3. Profiles the old code created during the step-1 deploy.
UPDATE "Player"
SET "nameKey"   = lower(btrim(regexp_replace("fullName", '\s+', ' ', 'g'))),
    "birthYear" = EXTRACT(YEAR FROM "dob")::int
WHERE "nameKey" IS NULL;

-- 4. Each registration gets its own person's profile: create the missing ones…
INSERT INTO "Player" ("id", "fullName", "email", "nameKey", "dob", "birthYear", "createdAt")
SELECT DISTINCT ON (k.email, k.name_key, k.birth_year)
       gen_random_uuid()::text, btrim(r."fullName"), k.email, k.name_key, r."dob", k.birth_year, now()
FROM "Registration" r
CROSS JOIN LATERAL (SELECT lower(btrim(r."email")) AS email,
                           lower(btrim(regexp_replace(r."fullName", '\s+', ' ', 'g'))) AS name_key,
                           EXTRACT(YEAR FROM r."dob")::int AS birth_year) k
WHERE NOT EXISTS (SELECT 1 FROM "Player" p
                  WHERE p."email" = k.email AND p."nameKey" = k.name_key
                    AND p."birthYear" IS NOT DISTINCT FROM k.birth_year)
ORDER BY k.email, k.name_key, k.birth_year, r."registeredAt" DESC;

-- …and point each registration at it.
UPDATE "Registration" r SET "playerId" = p."id"
FROM "Player" p
WHERE p."email" = lower(btrim(r."email"))
  AND p."nameKey" = lower(btrim(regexp_replace(r."fullName", '\s+', ' ', 'g')))
  AND p."birthYear" IS NOT DISTINCT FROM EXTRACT(YEAR FROM r."dob")::int
  AND r."playerId" IS DISTINCT FROM p."id";

-- 5. The name key is always set from now on; emails are still looked up.
ALTER TABLE "Player" ALTER COLUMN "nameKey" SET NOT NULL;

CREATE INDEX "Player_email_idx" ON "Player"("email");
