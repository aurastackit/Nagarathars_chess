-- Registration workflow: registration numbers, review metadata, withdrawals,
-- event date changes and a per-registration audit trail.
-- Generated with `prisma migrate diff`, then edited by hand to backfill existing rows.
-- Safe to run while the previous code is still live: nothing new is required on insert
-- (updatedAt has a default; registrationNo stays nullable until a follow-up migration
-- sets NOT NULL once the new code has numbered every row).

-- 1. Tournament: registration number counter and date-change tracking.
ALTER TABLE "Tournament" ADD COLUMN     "dateChangedAt" TIMESTAMP(3),
ADD COLUMN     "previousStartDate" TIMESTAMP(3),
ADD COLUMN     "registrationSeq" INTEGER NOT NULL DEFAULT 0;

-- 2. Registration: new columns.
ALTER TABLE "Registration" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "dateChangeRespondedAt" TIMESTAMP(3),
ADD COLUMN     "dateChangeResponse" TEXT,
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "withdrawReason" TEXT,
ADD COLUMN     "withdrawnAt" TIMESTAMP(3);

-- 3. Legacy status "registered" meant confirmed.
UPDATE "Registration" SET "status" = 'confirmed' WHERE "status" = 'registered';

-- 4. Backfill updatedAt with the submission time.
UPDATE "Registration" SET "updatedAt" = "registeredAt";

-- 5. Backfill registration numbers per tournament in submission order:
--    NCC{YY}-{CAT}-{NNNN}, YY = tournament start year (IST), CAT = category at submission.
UPDATE "Registration" r
SET "registrationNo" = n."no"
FROM (
  SELECT r2."id",
         'NCC' || to_char((t."startDate" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YY')
         || '-' || CASE r2."ageCategory"
                     WHEN 'under_11' THEN 'U11'
                     WHEN '11_to_18' THEN 'U19'
                     WHEN 'above_19' THEN 'A19'
                     ELSE 'GEN'
                   END
         || '-' || lpad(row_number() OVER (PARTITION BY r2."tournamentId" ORDER BY r2."registeredAt", r2."id")::text, 4, '0') AS "no"
  FROM "Registration" r2
  JOIN "Tournament" t ON t."id" = r2."tournamentId"
) n
WHERE r."id" = n."id";

-- 6. Each tournament's counter continues after its existing registrations.
UPDATE "Tournament" t
SET "registrationSeq" = c."n"
FROM (SELECT "tournamentId", count(*)::int AS "n" FROM "Registration" GROUP BY "tournamentId") c
WHERE t."id" = c."tournamentId";

-- 7. One number per tournament.
CREATE UNIQUE INDEX "Registration_tournamentId_registrationNo_key" ON "Registration"("tournamentId", "registrationNo");

-- 8. Audit trail.
CREATE TABLE "RegistrationEvent" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actor" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrationEvent_registrationId_createdAt_idx" ON "RegistrationEvent"("registrationId", "createdAt");
CREATE INDEX "RegistrationEvent_type_createdAt_idx" ON "RegistrationEvent"("type", "createdAt");

ALTER TABLE "RegistrationEvent" ADD CONSTRAINT "RegistrationEvent_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same as every other table: no access through Supabase's public API.
ALTER TABLE "public"."RegistrationEvent" ENABLE ROW LEVEL SECURITY;

-- 9. History for existing rows: a "submitted" event for each registration...
INSERT INTO "RegistrationEvent" ("id", "registrationId", "type", "actorType", "actor", "note", "createdAt")
SELECT gen_random_uuid()::text, r."id", 'submitted', 'player', lower(r."email"), 'Backfilled from the registration date', r."registeredAt"
FROM "Registration" r;

-- ...and one event per past admin decision type, from the activity log (first occurrence;
-- repeated clicks logged the same decision several times).
INSERT INTO "RegistrationEvent" ("id", "registrationId", "type", "actorType", "actor", "note", "createdAt")
SELECT gen_random_uuid()::text, d."targetId",
       CASE d."action" WHEN 'registration.confirm' THEN 'confirmed' ELSE 'rejected' END,
       'admin', d."actorEmail", 'Backfilled from the activity log', d."at"
FROM (
  SELECT l."targetId", l."action", min(l."createdAt") AS "at",
         (array_agg(l."actorEmail" ORDER BY l."createdAt"))[1] AS "actorEmail"
  FROM "AdminActivityLog" l
  JOIN "Registration" r ON r."id" = l."targetId"
  WHERE l."action" IN ('registration.confirm', 'registration.reject')
  GROUP BY l."targetId", l."action"
) d;

-- 10. reviewedAt / reviewedBy from the latest decision that matches the current status.
UPDATE "Registration" r
SET "reviewedAt" = e."createdAt", "reviewedBy" = e."actor"
FROM (
  SELECT DISTINCT ON ("registrationId") "registrationId", "type", "createdAt", "actor"
  FROM "RegistrationEvent"
  WHERE "type" IN ('confirmed', 'rejected')
  ORDER BY "registrationId", "createdAt" DESC
) e
WHERE r."id" = e."registrationId" AND r."status" = e."type";
