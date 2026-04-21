import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverErrorResponse, notFoundResponse } from '@/lib/api-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { shareToken: params.shareToken },
      include: {
        teams: { include: { team: true } },
        matches: {
          include: {
            teamA: true,
            teamB: true,
            innings: {
              include: {
                batterScores: { include: { player: true } },
                bowlerScores: { include: { player: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!tournament) return notFoundResponse('Tournament');

    // Build points table for LEAGUE format
    let pointsTable = null;
    if (tournament.format === 'LEAGUE') {
      const table: Record<string, { teamId: string; name: string; played: number; won: number; lost: number; tied: number; nrr: number; points: number }> = {};
      tournament.teams.forEach(({ team }) => {
        table[team.id] = { teamId: team.id, name: team.name, played: 0, won: 0, lost: 0, tied: 0, nrr: 0, points: 0 };
      });
      tournament.matches
        .filter((m) => m.status === 'COMPLETED')
        .forEach((match) => {
          const inn1 = match.innings.find((i) => i.inningsNumber === 1);
          const inn2 = match.innings.find((i) => i.inningsNumber === 2);
          if (!inn1 || !inn2) return;
          const teamAEntry = table[match.teamAId];
          const teamBEntry = table[match.teamBId];
          if (!teamAEntry || !teamBEntry) return;
          teamAEntry.played++;
          teamBEntry.played++;
          // Determine winner based on which team scored more
          const inn1IsTeamA = inn1.battingTeamId === match.teamAId;
          const teamARuns = inn1IsTeamA ? inn1.totalRuns : inn2.totalRuns;
          const teamBRuns = inn1IsTeamA ? inn2.totalRuns : inn1.totalRuns;
          if (teamARuns > teamBRuns) {
            teamAEntry.won++; teamAEntry.points += 2;
            teamBEntry.lost++;
          } else if (teamBRuns > teamARuns) {
            teamBEntry.won++; teamBEntry.points += 2;
            teamAEntry.lost++;
          } else {
            teamAEntry.tied++; teamAEntry.points++;
            teamBEntry.tied++; teamBEntry.points++;
          }
        });
      pointsTable = Object.values(table).sort((a, b) => b.points - a.points || b.nrr - a.nrr);
    }

    return NextResponse.json({ ...tournament, pointsTable });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
