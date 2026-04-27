import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';
import { Edit, UserPlus } from 'lucide-react';
import { TeamInviteButton } from '@/components/TeamInviteButton';
import { RemovePlayerButton } from '@/components/RemovePlayerButton';

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const team = await prisma.team.findFirst({
    where: {
      id: params.id,
      OR: [
        { userId: session.user.id },
        { captainUserId: session.user.id },
        { players: { some: { player: { userId: session.user.id } } } },
      ],
    },
    include: {
      players: { include: { player: true } },
      captainUser: { select: { id: true, name: true, email: true } },
      matchesAsTeamA: { include: { teamB: true, innings: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      matchesAsTeamB: { include: { teamA: true, innings: true }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!team) notFound();

  const isOwnerOrCaptain = team.userId === session.user.id || (team as any).captainUserId === session.user.id;

  const allMatches = [
    ...team.matchesAsTeamA.map((m) => ({ ...m, isTeamA: true })),
    ...team.matchesAsTeamB.map((m) => ({ ...m, isTeamA: false })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  const won = allMatches.filter((m) => {
    if (m.status !== 'COMPLETED') return false;
    const inn1 = m.innings.find((i) => i.inningsNumber === 1);
    const inn2 = m.innings.find((i) => i.inningsNumber === 2);
    if (!inn1 || !inn2) return false;
    const teamRuns = m.isTeamA
      ? (inn1.battingTeamId === team.id ? inn1.totalRuns : inn2.totalRuns)
      : (inn1.battingTeamId === team.id ? inn1.totalRuns : inn2.totalRuns);
    const oppRuns = m.isTeamA
      ? (inn1.battingTeamId !== team.id ? inn1.totalRuns : inn2.totalRuns)
      : (inn1.battingTeamId !== team.id ? inn1.totalRuns : inn2.totalRuns);
    return teamRuns > oppRuns;
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ backgroundColor: team.color }}
          >
            {team.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.homeGround && <p className="text-muted-foreground">{team.homeGround}</p>}
            <p className="text-sm text-muted-foreground">{team.players.length} players</p>
            {(team as any).captainUser && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Captain: <span className="font-medium text-foreground">{(team as any).captainUser.name ?? (team as any).captainUser.email}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <TeamInviteButton joinToken={(team as any).joinToken} teamName={team.name} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/teams/${team.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
          </Button>
        </div>
      </div>

      {/* Record */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Matches', value: allMatches.filter((m) => m.status === 'COMPLETED').length },
          { label: 'Won', value: won },
          { label: 'Lost', value: allMatches.filter((m) => m.status === 'COMPLETED').length - won },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-black text-cricket-green">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Squad */}
      <Card>
        <CardHeader><CardTitle className="text-base">Squad ({team.players.length})</CardTitle></CardHeader>
        <CardContent>
          {team.players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-border">
              <div className="rounded-2xl bg-muted p-3 mb-3">
                <UserPlus className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-sm mb-1">No players yet</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Tap <span className="font-medium text-foreground">Invite</span> above to share your team link. Players join once they sign up.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {team.players.map(({ player }) => (
              <div key={player.id} className="flex items-center gap-2 rounded-lg border border-border p-2 hover:border-cricket-green/40 transition-colors">
                <Link href={`/players/${player.id}`} className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0">
                    {getInitials(player.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{player.name}</p>
                    <p className="text-xs text-muted-foreground">{player.battingStyle[0]}HB · {player.bowlingStyle[0]}</p>
                  </div>
                </Link>
                {isOwnerOrCaptain && (
                  <RemovePlayerButton teamId={team.id} playerId={player.id} />
                )}
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
