-- ID card QR token: a random, unique token per registration (/verify/<token>).
-- Generated with `prisma migrate diff`, then edited by hand to backfill confirmed rows.
-- Safe while the previous code is still live: the column is nullable and nothing reads it yet.

-- 1. New column + unique index.
ALTER TABLE "Registration" ADD COLUMN     "verifyToken" TEXT;

CREATE UNIQUE INDEX "Registration_verifyToken_key" ON "Registration"("verifyToken");

-- 2. Backfill confirmed registrations (and legacy 'registered', which meant confirmed).
--    Token = the 16 random bytes of a v4 UUID as URL-safe base64 without padding: 22 chars,
--    122 random bits. New tokens are set by the app when a registration is confirmed.
UPDATE "Registration"
SET "verifyToken" = translate(
      encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'),
      '+/=', '-_')
WHERE "status" IN ('confirmed', 'registered') AND "verifyToken" IS NULL;
