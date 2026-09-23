-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "playerId" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "resultsPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pairing" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "board" INTEGER,
    "whitePlayerId" TEXT,
    "blackPlayerId" TEXT,
    "result" TEXT,

    CONSTRAINT "Pairing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Round_tournamentId_number_key" ON "Round"("tournamentId", "number");

-- CreateIndex
CREATE INDEX "Pairing_roundId_idx" ON "Pairing"("roundId");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pairing" ADD CONSTRAINT "Pairing_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pairing" ADD CONSTRAINT "Pairing_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pairing" ADD CONSTRAINT "Pairing_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
