import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Shield } from 'lucide-react';

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { captainUserId: session.user.id },
        { players: { some: { player: { userId: session.user.id } } } },
      ],
    },
    include: {
      players: { include: { player: true } },
      _count: { select: { matchesAsTeamA: true, matchesAsTeamB: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild className="bg-cricket-green hover:bg-cricket-green/90">
          <Link href="/teams/new"><Plus className="mr-2 h-4 w-4" />New Team</Link>
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="mb-1 font-semibold">No teams yet</p>
            <p className="text-sm text-muted-foreground">Create a team to start scoring matches</p>
            <Button asChild className="mt-4 bg-cricket-green hover:bg-cricket-green/90">
              <Link href="/teams/new">Create Team</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:border-cricket-green/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{team.name}</p>
                      {team.homeGround && <p className="text-xs text-muted-foreground">{team.homeGround}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {team.players.length} player{team.players.length !== 1 ? 's' : ''}
                    &nbsp;·&nbsp;
                    {team._count.matchesAsTeamA + team._count.matchesAsTeamB} matches
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {team.players.slice(0, 5).map(({ player }) => (
                      <span key={player.id} className="rounded bg-muted px-1.5 py-0.5 text-xs">{player.name.split(' ')[0]}</span>
                    ))}
                    {team.players.length > 5 && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">+{team.players.length - 5}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
