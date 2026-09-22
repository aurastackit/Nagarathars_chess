-- DropIndex
DROP INDEX "Registration_tournamentId_email_key";

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "ageProofKey" TEXT,
ADD COLUMN     "ageProofType" TEXT,
ADD COLUMN     "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guardianConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "passportPhotoKey" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'not_required',
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX "Registration_tournamentId_email_dob_key" ON "Registration"("tournamentId", "email", "dob");
