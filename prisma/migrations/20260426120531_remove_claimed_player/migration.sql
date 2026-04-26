/*
  Warnings:

  - You are about to drop the column `claimedPlayerId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_claimedPlayerId_fkey";

-- DropIndex
DROP INDEX "User_claimedPlayerId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "claimedPlayerId";
