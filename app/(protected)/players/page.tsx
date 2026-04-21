import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import PlayersFilter from './PlayersFilter';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { search?: string; battingStyle?: string; bowlingStyle?: string };
}

export default async function PlayersPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const players = await prisma.player.findMany({
    where: {
      userId: session.user.id,
      ...(searchParams.search && {
        OR: [
          { name: { contains: searchParams.search, mode: 'insensitive' } },
          { phone: { contains: searchParams.search, mode: 'insensitive' } },
        ],
      }),
      ...(searchParams.battingStyle && { battingStyle: searchParams.battingStyle }),
      ...(searchParams.bowlingStyle && { bowlingStyle: searchParams.bowlingStyle }),
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Players</h1>
          <p className="text-muted-foreground">{players.length} player{players.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild className="bg-cricket-green hover:bg-cricket-green/90">
          <Link href="/players/new"><Plus className="mr-2 h-4 w-4" />Add Player</Link>
        </Button>
      </div>

      <PlayersFilter />

      {players.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="mb-1 font-semibold">No players found</p>
            <p className="text-sm text-muted-foreground">Add players manually or import from contacts</p>
            <Button asChild className="mt-4 bg-cricket-green hover:bg-cricket-green/90">
              <Link href="/players/new">Add Player</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <Link key={player.id} href={`/players/${player.id}`}>
              <Card className="hover:border-cricket-green/40 transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cricket-green/20 text-sm font-bold text-cricket-green">
                      {getInitials(player.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{player.name}</p>
                    {player.phone && <p className="text-sm text-muted-foreground">{player.phone}</p>}
                    <p className="text-xs text-muted-foreground">
                      {player.battingStyle} bat · {player.bowlingStyle} bowl
                    </p>
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
