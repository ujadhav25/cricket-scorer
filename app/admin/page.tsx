import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Activity, Trophy, UserCircle, Zap } from 'lucide-react';
import { formatDate } from '@/lib/utils';

function trend(curr: number, prev: number): { text: string; cls: string } {
  if (prev === 0 && curr === 0) return { text: '–', cls: 'text-muted-foreground' };
  if (prev === 0) return { text: `+${curr} new`, cls: 'text-cricket-green' };
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct > 0) return { text: `+${pct}% vs prev week`, cls: 'text-cricket-green' };
  if (pct < 0) return { text: `${pct}% vs prev week`, cls: 'text-red-400' };
  return { text: 'same as prev week', cls: 'text-muted-foreground' };
}

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') redirect('/dashboard');

  const now = new Date();
  const d7  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);
  const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalPlayers,
    totalTeams,
    totalMatches,
    totalTournaments,
    completedMatches,
    liveMatches,
    upcomingMatches,
    newUsersThisWeek,
    newUsersLastWeek,
    newMatchesThisWeek,
    newMatchesLastWeek,
    activeOrganizers30d,
    tournamentMatches,
    recentUsers,
    recentMatches,
    topOrganizers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.player.count(),
    prisma.team.count(),
    prisma.match.count(),
    prisma.tournament.count(),
    prisma.match.count({ where: { status: 'COMPLETED' } }),
    prisma.match.count({ where: { status: 'LIVE' } }),
    prisma.match.count({ where: { status: 'UPCOMING' } }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d14, lt: d7 } } }),
    prisma.match.count({ where: { createdAt: { gte: d7 } } }),
    prisma.match.count({ where: { createdAt: { gte: d14, lt: d7 } } }),
    prisma.user.count({ where: { matches: { some: { createdAt: { gte: d30 } } } } }),
    prisma.match.count({ where: { tournamentId: { not: null } } }),
    // Raw query avoids Prisma enum validation crash when DB enum is ahead of generated client
    prisma.$queryRaw<{ id: string; name: string | null; email: string | null; role: string; createdAt: Date }[]>`
      SELECT id, name, email, role::text, "createdAt"
      FROM "User" ORDER BY "createdAt" DESC LIMIT 8
    `,
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
    prisma.user.findMany({
      take: 5,
      where: { matches: { some: {} } },
      orderBy: { matches: { _count: 'desc' } },
      select: {
        id: true, name: true, email: true,
        _count: { select: { matches: true, tournaments: true, teams: true } },
      },
    }),
  ]);

  const completionRate     = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  const tournamentAdoption = totalMatches > 0 ? Math.round((tournamentMatches  / totalMatches) * 100) : 0;
  const retentionRate      = totalUsers   > 0 ? Math.round((activeOrganizers30d / totalUsers)  * 100) : 0;
  const userTrend  = trend(newUsersThisWeek,  newUsersLastWeek);
  const matchTrend = trend(newMatchesThisWeek, newMatchesLastWeek);

  const platformStats = [
    { label: 'Total Users',   value: totalUsers,       icon: Users,      href: '/admin/users',              color: 'text-blue-400'        },
    { label: 'Players',       value: totalPlayers,     icon: UserCircle, href: '/admin/players',            color: 'text-cricket-green'   },
    { label: 'Teams',         value: totalTeams,       icon: Shield,     href: '/admin/teams',              color: 'text-purple-400'      },
    { label: 'Matches',       value: totalMatches,     icon: Activity,   href: '/admin/matches',            color: 'text-orange-400'      },
    { label: 'Tournaments',   value: totalTournaments, icon: Trophy,     href: '/admin/tournaments',        color: 'text-amber-400'       },
    { label: 'Live Now',      value: liveMatches,      icon: Zap,        href: '/admin/matches?status=LIVE', color: 'text-red-400'        },
  ];

  const roleColor: Record<string, string> = {
    ORGANIZER:   'bg-blue-500/15 text-blue-400',
    PLAYER:      'bg-cricket-green-500/15 text-cricket-green',
    SUPER_ADMIN: 'bg-red-500/15 text-red-400',
  };

  const statusColor: Record<string, string> = {
    LIVE:      'bg-red-500/15 text-red-400',
    COMPLETED: 'bg-cricket-green-500/15 text-cricket-green',
    UPCOMING:  'bg-amber-500/15 text-amber-400',
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide statistics and activity</p>
      </div>

      {/* Platform totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {platformStats.map(({ label, value, icon: Icon, href, color }) => (
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

      {/* Growth & engagement trends */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">New Users (7d)</p>
            <p className="text-3xl font-bold tabular-nums">{newUsersThisWeek}</p>
            <p className={`text-xs font-medium ${userTrend.cls}`}>{userTrend.text}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">New Matches (7d)</p>
            <p className="text-3xl font-bold tabular-nums">{newMatchesThisWeek}</p>
            <p className={`text-xs font-medium ${matchTrend.cls}`}>{matchTrend.text}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Organizers (30d)</p>
            <p className="text-3xl font-bold tabular-nums">{activeOrganizers30d}</p>
            <p className="text-xs text-muted-foreground">{retentionRate}% of all users active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tournament Adoption</p>
            <p className="text-3xl font-bold tabular-nums">{tournamentAdoption}%</p>
            <p className="text-xs text-muted-foreground">{tournamentMatches} of {totalMatches} matches</p>
          </CardContent>
        </Card>
      </div>

      {/* Match lifecycle funnel */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Match Lifecycle Funnel</p>
            <p className="text-xs text-muted-foreground">
              Completion rate: <span className="font-bold text-foreground">{completionRate}%</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-2xl font-bold text-amber-400 tabular-nums">{upcomingMatches}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upcoming</p>
            </div>
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-2xl font-bold text-red-400 tabular-nums">{liveMatches}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Live</p>
            </div>
            <div className="rounded-xl bg-cricket-green-500/10 border border-cricket-green-500/20 p-3">
              <p className="text-2xl font-bold text-cricket-green tabular-nums">{completedMatches}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
            </div>
          </div>
          {totalMatches > 0 && (
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-amber-500" style={{ width: `${Math.round((upcomingMatches / totalMatches) * 100)}%` }} />
              <div className="h-full bg-red-500"   style={{ width: `${Math.round((liveMatches      / totalMatches) * 100)}%` }} />
              <div className="h-full bg-cricket-green-500" style={{ width: `${Math.round((completedMatches / totalMatches) * 100)}%` }} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Organizers — key decision metric */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Top Organizers by Activity
              <Link href="/admin/users" className="text-xs text-cricket-green hover:underline">View all</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {topOrganizers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-sm font-bold text-muted-foreground/50 w-5 tabular-nums shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name ?? 'No name'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <span><span className="font-bold text-foreground tabular-nums">{u._count.matches}</span> matches</span>
                    <span><span className="font-bold text-foreground tabular-nums">{u._count.tournaments}</span> tours</span>
                  </div>
                </div>
              ))}
              {topOrganizers.length === 0 && (
                <p className="text-sm text-muted-foreground px-4 py-4 text-center">No matches created yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Recent Signups
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
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleColor[u.role] ?? 'bg-muted text-muted-foreground'}`}>
                      {u.role === 'SUPER_ADMIN' ? 'SA' : u.role === 'ORGANIZER' ? 'ORG' : 'PLR'}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(u.createdAt.toISOString())}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <p className="text-xs text-muted-foreground">
                    by {m.user.name ?? 'Unknown'} · {m.matchType} · {formatDate(m.createdAt.toISOString())}
                  </p>
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
  );
}
