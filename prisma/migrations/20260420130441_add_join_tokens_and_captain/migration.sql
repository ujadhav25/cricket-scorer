/*
  Warnings:

  - A unique constraint covering the columns `[joinToken]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[joinToken]` on the table `Tournament` will be added. If there are existing duplicate values, this will fail.
  - The required column `joinToken` was added to the `Team` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `joinToken` was added to the `Tournament` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable: add nullable first, backfill with gen_random_uuid(), then set NOT NULL
ALTER TABLE "Team" ADD COLUMN "captainUserId" TEXT,
ADD COLUMN "joinToken" TEXT;
UPDATE "Team" SET "joinToken" = gen_random_uuid()::TEXT WHERE "joinToken" IS NULL;
ALTER TABLE "Team" ALTER COLUMN "joinToken" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "joinToken" TEXT;
UPDATE "Tournament" SET "joinToken" = gen_random_uuid()::TEXT WHERE "joinToken" IS NULL;
ALTER TABLE "Tournament" ALTER COLUMN "joinToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Team_joinToken_key" ON "Team"("joinToken");

-- CreateIndex
CREATE INDEX "Team_captainUserId_idx" ON "Team"("captainUserId");

-- CreateIndex
CREATE INDEX "Team_joinToken_idx" ON "Team"("joinToken");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_joinToken_key" ON "Tournament"("joinToken");

-- CreateIndex
CREATE INDEX "Tournament_joinToken_idx" ON "Tournament"("joinToken");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_captainUserId_fkey" FOREIGN KEY ("captainUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
