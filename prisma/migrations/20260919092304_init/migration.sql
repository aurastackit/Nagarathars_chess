-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'classical',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "entryFee" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER,
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "posterImageUrl" TEXT,
    "brochurePdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "city" TEXT,
    "address" TEXT,
    "fideId" TEXT,
    "rating" INTEGER,
    "kovil" TEXT,
    "pirivu" TEXT,
    "native" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "fatherGrandparents" TEXT,
    "motherGrandparents" TEXT,
    "motherNative" TEXT,
    "motherKovil" TEXT,
    "motherPirivu" TEXT,
    "sangamMember" BOOLEAN NOT NULL DEFAULT false,
    "aadhaarImageData" TEXT,
    "passportPhotoData" TEXT,
    "ageCategory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassProgram" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL,
    "classProgramId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fideId" TEXT,
    "message" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_tournamentId_email_key" ON "Registration"("tournamentId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "ClassProgram_slug_key" ON "ClassProgram"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClassEnrollment_classProgramId_email_key" ON "ClassEnrollment"("classProgramId", "email");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classProgramId_fkey" FOREIGN KEY ("classProgramId") REFERENCES "ClassProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
