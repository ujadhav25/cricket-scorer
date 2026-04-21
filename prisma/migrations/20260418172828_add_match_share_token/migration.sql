/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - The required column `shareToken` was added to the `Match` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable: add nullable first, populate, then make required
ALTER TABLE "Match" ADD COLUMN "shareToken" TEXT;
UPDATE "Match" SET "shareToken" = gen_random_uuid()::text WHERE "shareToken" IS NULL;
ALTER TABLE "Match" ALTER COLUMN "shareToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Match_shareToken_key" ON "Match"("shareToken");

-- CreateIndex
CREATE INDEX "Match_shareToken_idx" ON "Match"("shareToken");
