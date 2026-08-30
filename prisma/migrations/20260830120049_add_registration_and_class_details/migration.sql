-- AlterTable
ALTER TABLE "ClassEnrollment" ADD COLUMN "fideId" TEXT;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN "ageCategory" TEXT;
ALTER TABLE "Registration" ADD COLUMN "kovil" TEXT;
ALTER TABLE "Registration" ADD COLUMN "pirivu" TEXT;
ALTER TABLE "Registration" ADD COLUMN "rating" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'group',
    "price" INTEGER NOT NULL DEFAULT 0,
    "maxGroupSize" INTEGER,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT NOT NULL,
    "scheduleText" TEXT NOT NULL,
    "instructorName" TEXT NOT NULL,
    "bannerImageUrl" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ClassProgram" ("bannerImageUrl", "createdAt", "description", "id", "instructorName", "isOnline", "level", "scheduleText", "slug", "title") SELECT "bannerImageUrl", "createdAt", "description", "id", "instructorName", "isOnline", "level", "scheduleText", "slug", "title" FROM "ClassProgram";
DROP TABLE "ClassProgram";
ALTER TABLE "new_ClassProgram" RENAME TO "ClassProgram";
CREATE UNIQUE INDEX "ClassProgram_slug_key" ON "ClassProgram"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
