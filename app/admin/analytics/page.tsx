import { adminAuth } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminAnalyticsPage() {
  const session = await adminAuth();
  if (!(session as any)?.admin) redirect('/admin/login');

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch last 30 days of daily user signups
  const userSignupsByDay = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
    SELECT DATE("createdAt") as day, COUNT(*) as count
    FROM "User"
    WHERE "createdAt" >= ${d30}
    GROUP BY DATE("createdAt")
    ORDER BY day ASC
  `;

  // Fetch last 30 days of daily match creation
  const matchesByDay = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
    SELECT DATE("createdAt") as day, COUNT(*) as count
    FROM "Match"
    WHERE "createdAt" >= ${d30}
    GROUP BY DATE("createdAt")
    ORDER BY day ASC
  `;

  const [
    totalUsers,
    totalMatches,
    completedMatches,
    totalTournaments,
    organizerCount,
    playerCount,
    tournamentMatches,
    avgRunsData,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.match.count({ where: { status: 'COMPLETED' } }),
    prisma.tournament.count(),
    prisma.user.count({ where: { role: 'ORGANIZER' } }),
    prisma.user.count({ where: { role: 'PLAYER' } }),
    prisma.match.count({ where: { tournamentId: { not: null } } }),
    prisma.innings.aggregate({ _avg: { totalRuns: true }, where: { isCompleted: true } }),
  ]);

  const completionRate = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  const tournamentAdoption = totalMatches > 0 ? Math.round((tournamentMatches / totalMatches) * 100) : 0;
  const avgRuns = Math.round(avgRunsData._avg.totalRuns ?? 0);

  // Build 30-day calendar for charts
  const days30: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days30.push(d.toISOString().split('T')[0]);
  }

  const userMap = Object.fromEntries(userSignupsByDay.map((r) => [r.day, Number(r.count)]));
  const matchMap = Object.fromEntries(matchesByDay.map((r) => [r.day, Number(r.count)]));

  const userChartData = days30.map((d) => ({ day: d, count: userMap[d] ?? 0 }));
  const matchChartData = days30.map((d) => ({ day: d, count: matchMap[d] ?? 0 }));

  const totalNewUsers30d = userChartData.reduce((s, r) => s + r.count, 0);
  const totalNewMatches30d = matchChartData.reduce((s, r) => s + r.count, 0);
  const maxUserDay = Math.max(...userChartData.map((r) => r.count), 1);
  const maxMatchDay = Math.max(...matchChartData.map((r) => r.count), 1);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform trends over the last 30 days</p>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">New Users (30d)</p>
            <p className="text-3xl font-bold tabular-nums text-blue-400">{totalNewUsers30d}</p>
            <p className="text-xs text-muted-foreground">{totalUsers} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">New Matches (30d)</p>
            <p className="text-3xl font-bold tabular-nums text-orange-400">{totalNewMatches30d}</p>
            <p className="text-xs text-muted-foreground">{totalMatches} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Completion Rate</p>
            <p className="text-3xl font-bold tabular-nums text-cricket-green">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">{completedMatches} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Runs / Innings</p>
            <p className="text-3xl font-bold tabular-nums text-amber-400">{avgRuns}</p>
            <p className="text-xs text-muted-foreground">across all innings</p>
          </CardContent>
        </Card>
      </div>

      {/* User signups chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Daily User Signups — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end gap-[2px] h-24">
            {userChartData.map((d) => (
              <div
                key={d.day}
                className="flex-1 bg-blue-500/60 hover:bg-blue-500 rounded-t transition-colors min-w-0 relative group"
                style={{ height: `${Math.max(4, (d.count / maxUserDay) * 100)}%` }}
                title={`${d.day}: ${d.count} signups`}
              >
                {d.count > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border border-border/30 rounded px-1 py-0.5 text-[10px] whitespace-nowrap z-10">
                    {d.count}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/50">
            <span>{userChartData[0]?.day.slice(5)}</span>
            <span>{userChartData[14]?.day.slice(5)}</span>
            <span>{userChartData[29]?.day.slice(5)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Match creation chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Daily Matches Created — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end gap-[2px] h-24">
            {matchChartData.map((d) => (
              <div
                key={d.day}
                className="flex-1 bg-orange-500/60 hover:bg-orange-500 rounded-t transition-colors min-w-0 relative group"
                style={{ height: `${Math.max(4, (d.count / maxMatchDay) * 100)}%` }}
                title={`${d.day}: ${d.count} matches`}
              >
                {d.count > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border border-border/30 rounded px-1 py-0.5 text-[10px] whitespace-nowrap z-10">
                    {d.count}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/50">
            <span>{matchChartData[0]?.day.slice(5)}</span>
            <span>{matchChartData[14]?.day.slice(5)}</span>
            <span>{matchChartData[29]?.day.slice(5)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Platform breakdown */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Role distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">User Role Split</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Organizers</span>
                <span className="font-bold tabular-nums text-blue-400">{organizerCount}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${totalUsers > 0 ? (organizerCount / totalUsers) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Players</span>
                <span className="font-bold tabular-nums text-cricket-green">{playerCount}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-cricket-green-500 rounded-full"
                  style={{ width: `${totalUsers > 0 ? (playerCount / totalUsers) * 100 : 0}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? Math.round((organizerCount / totalUsers) * 100) : 0}% are organizers
            </p>
          </CardContent>
        </Card>

        {/* Tournament adoption */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tournament Adoption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center">
              <div className="relative h-24 w-24">
                <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${tournamentAdoption} ${100 - tournamentAdoption}`}
                    strokeLinecap="round"
                    className="text-amber-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold tabular-nums">{tournamentAdoption}%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {tournamentMatches} of {totalMatches} matches are in tournaments
            </p>
            <p className="text-xs text-muted-foreground text-center">{totalTournaments} tournaments created</p>
          </CardContent>
        </Card>

        {/* Match funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Match Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center">
              <div className="relative h-24 w-24">
                <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${completionRate} ${100 - completionRate}`}
                    strokeLinecap="round"
                    className="text-cricket-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold tabular-nums">{completionRate}%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {completedMatches} of {totalMatches} matches completed
            </p>
            <p className="text-xs text-muted-foreground text-center">Avg {avgRuns} runs per innings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
