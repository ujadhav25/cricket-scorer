import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Shield } from 'lucide-react';

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const cookieStore = await cookies();
  const isPlayerView = (cookieStore.get('view-mode')?.value ?? 'player') === 'player';

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-0.5">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
        </div>
        {!isPlayerView && (
          <Button asChild>
            <Link href="/teams/new"><Plus className="mr-2 h-4 w-4" />New Team</Link>
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-2xl bg-white/[0.04] p-4 mb-4">
              <Shield className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="mb-1 font-bold">No teams yet</p>
            {isPlayerView ? (
              <p className="text-sm text-muted-foreground">Ask your organizer to share an invite link to join a team.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">Create a team to start scoring matches</p>
                <Button asChild>
                  <Link href="/teams/new">Create Team</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="group hover:border-border/60 hover:shadow-lg transition-all duration-300">
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
                      <span key={player.id} className="rounded-lg bg-white/[0.04] border border-border/20 px-2 py-0.5 text-xs">{player.name.split(' ')[0]}</span>
                    ))}
                    {team.players.length > 5 && (
                      <span className="rounded-lg bg-white/[0.04] border border-border/20 px-2 py-0.5 text-xs">+{team.players.length - 5}</span>
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
