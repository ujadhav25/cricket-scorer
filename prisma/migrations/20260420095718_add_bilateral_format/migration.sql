-- AlterEnum
ALTER TYPE "TournamentFormat" ADD VALUE 'BILATERAL';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "totalMatches" INTEGER NOT NULL DEFAULT 3;
