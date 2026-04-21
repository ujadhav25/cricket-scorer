import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trophy } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function TournamentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { teams: { some: { team: { players: { some: { player: { userId: session.user.id } } } } } } },
      ],
    },
    include: {
      teams: { include: { team: true } },
      _count: { select: { matches: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">{tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild className="bg-cricket-green hover:bg-cricket-green/90">
          <Link href="/tournaments/new"><Plus className="mr-2 h-4 w-4" />New</Link>
        </Button>
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="mb-1 font-semibold">No tournaments yet</p>
            <Button asChild className="mt-4 bg-cricket-green hover:bg-cricket-green/90">
              <Link href="/tournaments/new">Create Tournament</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <Card className="hover:border-cricket-green/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.format} · {t.teams.length} teams · {t._count.matches} matches</p>
                      {t.startDate && <p className="text-xs text-muted-foreground mt-1">{formatDate(t.startDate)}</p>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.status === 'LIVE' ? 'bg-red-500 text-white' :
                      t.status === 'COMPLETED' ? 'bg-green-700 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.teams.slice(0, 4).map(({ team }) => (
                      <span key={team.id} className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: team.color + '30', color: team.color }}>{team.name}</span>
                    ))}
                    {t.teams.length > 4 && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">+{t.teams.length - 4}</span>}
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
