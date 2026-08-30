-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'classical',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "entryFee" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER,
    "registrationDeadline" DATETIME NOT NULL,
    "posterImageUrl" TEXT,
    "brochurePdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" DATETIME,
    "gender" TEXT,
    "city" TEXT,
    "fideId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Registration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduleText" TEXT NOT NULL,
    "instructorName" TEXT NOT NULL,
    "bannerImageUrl" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classProgramId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassEnrollment_classProgramId_fkey" FOREIGN KEY ("classProgramId") REFERENCES "ClassProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_tournamentId_email_key" ON "Registration"("tournamentId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "ClassProgram_slug_key" ON "ClassProgram"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClassEnrollment_classProgramId_email_key" ON "ClassEnrollment"("classProgramId", "email");
