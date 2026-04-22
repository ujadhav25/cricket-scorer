-- Add balls column to BowlerScore
ALTER TABLE "BowlerScore" ADD COLUMN "balls" INTEGER NOT NULL DEFAULT 0;

-- CreateTable Partnership
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "batsman1Id" TEXT NOT NULL,
    "batsman2Id" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "startOver" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endOver" DOUBLE PRECISION,
    "isUnbroken" BOOLEAN NOT NULL DEFAULT true,
    "wicketFallBatsmanId" TEXT,

    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Partnership_inningsId_idx" ON "Partnership"("inningsId");

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PushSubscription
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_matchId_idx" ON "PushSubscription"("matchId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable TournamentGroup
CREATE TABLE "TournamentGroup" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TournamentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentGroup_tournamentId_idx" ON "TournamentGroup"("tournamentId");

-- AddForeignKey
ALTER TABLE "TournamentGroup" ADD CONSTRAINT "TournamentGroup_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable TournamentGroupTeam
CREATE TABLE "TournamentGroupTeam" (
    "groupId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "TournamentGroupTeam_pkey" PRIMARY KEY ("groupId","teamId")
);

-- AddForeignKey
ALTER TABLE "TournamentGroupTeam" ADD CONSTRAINT "TournamentGroupTeam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TournamentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroupTeam" ADD CONSTRAINT "TournamentGroupTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
