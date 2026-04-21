import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { History } from 'lucide-react';

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const matches = await prisma.match.findMany({
    where: { userId: session.user.id, status: 'COMPLETED' },
    include: {
      teamA: true,
      teamB: true,
      tournament: { select: { name: true } },
      innings: { select: { totalRuns: true, totalWickets: true, inningsNumber: true, battingTeamId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Match History</h1>
        <p className="text-muted-foreground">{matches.length} completed matches</p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">No completed matches yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const inn1 = match.innings.find((i) => i.inningsNumber === 1);
            const inn2 = match.innings.find((i) => i.inningsNumber === 2);
            const teamARuns = inn1?.battingTeamId === match.teamAId ? inn1?.totalRuns : inn2?.totalRuns;
            const teamBRuns = inn1?.battingTeamId === match.teamBId ? inn1?.totalRuns : inn2?.totalRuns;
            const winner = teamARuns !== undefined && teamBRuns !== undefined
              ? teamARuns > teamBRuns ? match.teamA.name
              : teamBRuns > teamARuns ? match.teamB.name
              : 'Tie' : null;
            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="hover:border-cricket-green/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{match.teamA.name} vs {match.teamB.name}</p>
                        {inn1 && inn2 && (
                          <p className="text-sm text-muted-foreground">
                            {match.teamA.name} {inn1.battingTeamId === match.teamAId ? `${inn1.totalRuns}/${inn1.totalWickets}` : `${inn2.totalRuns}/${inn2.totalWickets}`}
                            {' · '}
                            {match.teamB.name} {inn1.battingTeamId === match.teamBId ? `${inn1.totalRuns}/${inn1.totalWickets}` : `${inn2.totalRuns}/${inn2.totalWickets}`}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{formatDate(match.createdAt)}</p>
                          {match.tournament && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">{match.tournament.name}</span>}
                        </div>
                      </div>
                      {winner && (
                        <span className="rounded-full bg-cricket-green/20 px-2 py-0.5 text-xs font-medium text-cricket-green">
                          {winner === 'Tie' ? 'TIE' : `${winner} won`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
