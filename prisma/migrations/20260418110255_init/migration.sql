-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "battingStyle" TEXT NOT NULL DEFAULT 'Right',
    "bowlingStyle" TEXT NOT NULL DEFAULT 'Medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#16a34a',
    "homeGround" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPlayer" (
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("teamId","playerId")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "TournamentFormat" NOT NULL DEFAULT 'LEAGUE',
    "shareToken" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'UPCOMING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "bannerUrl" TEXT,
    "defaultOvers" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentTeam" (
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("tournamentId","teamId")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "teamAId" TEXT NOT NULL,
    "teamBId" TEXT NOT NULL,
    "overs" INTEGER NOT NULL DEFAULT 20,
    "venue" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "tossWinner" TEXT,
    "tossDecision" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'UPCOMING',
    "matchType" TEXT NOT NULL DEFAULT 'Friendly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Innings" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "battingTeamId" TEXT NOT NULL,
    "inningsNumber" INTEGER NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "totalWickets" INTEGER NOT NULL DEFAULT 0,
    "totalOvers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,
    "legByes" INTEGER NOT NULL DEFAULT 0,
    "byes" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Innings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "overNumber" INTEGER NOT NULL,
    "ballNumber" INTEGER NOT NULL,
    "batsmanId" TEXT NOT NULL,
    "bowlerId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "isWide" BOOLEAN NOT NULL DEFAULT false,
    "isNoBall" BOOLEAN NOT NULL DEFAULT false,
    "isLegBye" BOOLEAN NOT NULL DEFAULT false,
    "isBye" BOOLEAN NOT NULL DEFAULT false,
    "isWicket" BOOLEAN NOT NULL DEFAULT false,
    "wicketType" TEXT,
    "fielderId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatterScore" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "dismissalType" TEXT,
    "dismissedById" TEXT,
    "isOut" BOOLEAN NOT NULL DEFAULT false,
    "battingOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BatterScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BowlerScore" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "overs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BowlerScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Player_userId_idx" ON "Player"("userId");

-- CreateIndex
CREATE INDEX "Team_userId_idx" ON "Team"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_shareToken_key" ON "Tournament"("shareToken");

-- CreateIndex
CREATE INDEX "Tournament_userId_idx" ON "Tournament"("userId");

-- CreateIndex
CREATE INDEX "Tournament_shareToken_idx" ON "Tournament"("shareToken");

-- CreateIndex
CREATE INDEX "Match_userId_idx" ON "Match"("userId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Innings_matchId_idx" ON "Innings"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Innings_matchId_inningsNumber_key" ON "Innings"("matchId", "inningsNumber");

-- CreateIndex
CREATE INDEX "Delivery_inningsId_idx" ON "Delivery"("inningsId");

-- CreateIndex
CREATE INDEX "Delivery_inningsId_overNumber_idx" ON "Delivery"("inningsId", "overNumber");

-- CreateIndex
CREATE INDEX "BatterScore_inningsId_idx" ON "BatterScore"("inningsId");

-- CreateIndex
CREATE UNIQUE INDEX "BatterScore_inningsId_playerId_key" ON "BatterScore"("inningsId", "playerId");

-- CreateIndex
CREATE INDEX "BowlerScore_inningsId_idx" ON "BowlerScore"("inningsId");

-- CreateIndex
CREATE UNIQUE INDEX "BowlerScore_inningsId_playerId_key" ON "BowlerScore"("inningsId", "playerId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innings" ADD CONSTRAINT "Innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innings" ADD CONSTRAINT "Innings_battingTeamId_fkey" FOREIGN KEY ("battingTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_batsmanId_fkey" FOREIGN KEY ("batsmanId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_bowlerId_fkey" FOREIGN KEY ("bowlerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_fielderId_fkey" FOREIGN KEY ("fielderId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatterScore" ADD CONSTRAINT "BatterScore_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatterScore" ADD CONSTRAINT "BatterScore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlerScore" ADD CONSTRAINT "BowlerScore_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlerScore" ADD CONSTRAINT "BowlerScore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
