-- CreateTable
CREATE TABLE "MatchReaction" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchReaction_matchId_idx" ON "MatchReaction"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchReaction_matchId_emoji_key" ON "MatchReaction"("matchId", "emoji");
