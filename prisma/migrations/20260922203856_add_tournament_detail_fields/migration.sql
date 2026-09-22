-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "prizeStructure" TEXT,
ADD COLUMN     "rounds" INTEGER,
ADD COLUMN     "rulesText" TEXT,
ADD COLUMN     "timeControl" TEXT;
