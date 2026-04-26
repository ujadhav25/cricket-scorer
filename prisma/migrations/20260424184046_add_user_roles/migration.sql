/*
  Warnings:

  - A unique constraint covering the columns `[claimedPlayerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ORGANIZER', 'PLAYER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeView" TEXT NOT NULL DEFAULT 'organizer',
ADD COLUMN     "claimedPlayerId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'ORGANIZER';

-- CreateIndex
CREATE UNIQUE INDEX "User_claimedPlayerId_key" ON "User"("claimedPlayerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_claimedPlayerId_fkey" FOREIGN KEY ("claimedPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
