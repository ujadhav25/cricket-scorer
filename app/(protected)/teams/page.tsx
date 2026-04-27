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
          {teams.map((team) => {
            const totalMatches = team._count.matchesAsTeamA + team._count.matchesAsTeamB;
            const visiblePlayers = team.players.slice(0, 6);
            const extraPlayers = team.players.length - visiblePlayers.length;
            return (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-border/50 hover:border-border">
                  {/* Colored banner */}
                  <div className="h-2 w-full" style={{ backgroundColor: team.color }} />
                  <CardContent className="p-5">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0 shadow-lg"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-base leading-tight truncate">{team.name}</p>
                        {team.homeGround
                          ? <p className="text-xs text-muted-foreground truncate mt-0.5">{team.homeGround}</p>
                          : <p className="text-xs text-muted-foreground/50 mt-0.5">No home ground</p>
                        }
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="text-center">
                        <p className="font-black text-lg leading-none">{team.players.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Players</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div className="text-center">
                        <p className="font-black text-lg leading-none">{totalMatches}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Matches</p>
                      </div>
                    </div>

                    {/* Player avatars */}
                    {team.players.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {visiblePlayers.map(({ player }) => (
                            <div
                              key={player.id}
                              className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold ring-1 ring-border/20"
                              title={player.name}
                            >
                              {player.name.slice(0, 1).toUpperCase()}
                            </div>
                          ))}
                          {extraPlayers > 0 && (
                            <div className="h-7 w-7 rounded-full border-2 border-background bg-muted/80 flex items-center justify-center text-[10px] font-bold text-muted-foreground ring-1 ring-border/20">
                              +{extraPlayers}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-1 truncate">
                          {visiblePlayers.map(({ player }) => player.name.split(' ')[0]).join(', ')}
                          {extraPlayers > 0 ? ` +${extraPlayers}` : ''}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic">No players yet</p>
                    )}
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
