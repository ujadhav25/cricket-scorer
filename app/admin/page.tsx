import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Activity, Trophy, UserCircle, Zap } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') redirect('/dashboard');

  const [
    totalUsers,
    totalPlayers,
    totalTeams,
    totalMatches,
    totalTournaments,
    completedMatches,
    liveMatches,
    recentUsers,
    recentMatches,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.player.count(),
    prisma.team.count(),
    prisma.match.count(),
    prisma.tournament.count(),
    prisma.match.count({ where: { status: 'COMPLETED' } }),
    prisma.match.count({ where: { status: 'LIVE' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.match.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, status: true, createdAt: true, matchType: true,
        teamA: { select: { name: true, color: true } },
        teamB: { select: { name: true, color: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, href: '/admin/users', color: 'text-blue-400' },
    { label: 'Players', value: totalPlayers, icon: UserCircle, href: '/admin/players', color: 'text-cricket-green' },
    { label: 'Teams', value: totalTeams, icon: Shield, href: '/admin/teams', color: 'text-purple-400' },
    { label: 'Matches', value: totalMatches, icon: Activity, href: '/admin/matches', color: 'text-orange-400' },
    { label: 'Tournaments', value: totalTournaments, icon: Trophy, href: '/admin/tournaments', color: 'text-amber-400' },
    { label: 'Live Now', value: liveMatches, icon: Zap, href: '/admin/matches?status=LIVE', color: 'text-red-400' },
  ];

  const roleColor: Record<string, string> = {
    ORGANIZER: 'bg-blue-500/15 text-blue-400',
    PLAYER: 'bg-cricket-green-500/15 text-cricket-green',
    SUPER_ADMIN: 'bg-red-500/15 text-red-400',
  };

  const statusColor: Record<string, string> = {
    LIVE: 'bg-red-500/15 text-red-400',
    COMPLETED: 'bg-cricket-green-500/15 text-cricket-green',
    UPCOMING: 'bg-amber-500/15 text-amber-400',
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide statistics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="hover:bg-card/80 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col gap-2">
                <Icon className={`h-5 w-5 ${color}`} />
                <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Match completion bar */}
      {totalMatches > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Matches completed</span>
              <span>{completedMatches} / {totalMatches}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-cricket-green-500 transition-all"
                style={{ width: `${Math.round((completedMatches / totalMatches) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Recent Users
              <Link href="/admin/users" className="text-xs text-cricket-green hover:underline">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name ?? 'No name'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleColor[u.role] ?? ''}`}>
                      {u.role}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(u.createdAt.toISOString())}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Recent Matches
              <Link href="/admin/matches" className="text-xs text-cricket-green hover:underline">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {recentMatches.map((m) => (
                <Link key={m.id} href={`/matches/${m.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      <span style={{ color: m.teamA.color }}>{m.teamA.name}</span>
                      <span className="text-muted-foreground mx-1">vs</span>
                      <span style={{ color: m.teamB.color }}>{m.teamB.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">by {m.user.name ?? 'Unknown'} · {m.matchType}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${statusColor[m.status] ?? ''}`}>
                    {m.status}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
