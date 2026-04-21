'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Trophy, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function JoinTournamentPage() {
  const { token } = useParams<{ token: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [tournament, setTournament] = useState<any>(null);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/join/tournament/${token}`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return; }
        setTournament(await r.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/teams').then((r) => r.json()).then(setMyTeams).catch(() => {});
    }
  }, [session]);

  async function handleJoin() {
    if (!selectedTeamId) return;
    setJoining(true);
    setError('');
    try {
      const res = await fetch(`/api/join/tournament/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeamId }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error ?? 'Failed to join'); return; }
      setJoined(true);
    } catch {
      setError('Network error, please try again');
    } finally {
      setJoining(false);
    }
  }

  const alreadyJoinedTeamIds = new Set((tournament?.teams ?? []).map((tt: any) => tt.team.id));
  const eligibleTeams = myTeams.filter((t) => !alreadyJoinedTeamIds.has(t.id));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
      <h1 className="text-2xl font-bold">Invalid Join Link</h1>
      <p className="text-muted-foreground">This tournament join link is no longer valid.</p>
    </div>
  );

  if (joined) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-4">
      <CheckCircle2 className="h-16 w-16 text-cricket-green" />
      <div className="text-center">
        <h1 className="text-2xl font-bold">Team Registered!</h1>
        <p className="text-muted-foreground mt-1">
          Your team has been added to <span className="font-semibold text-foreground">{tournament?.name}</span>.
        </p>
      </div>
      <Button onClick={() => router.push('/tournaments')} className="bg-cricket-green hover:bg-cricket-green/90">
        Go to Tournaments
      </Button>
    </div>
  );

  const statusLabel: Record<string, string> = { UPCOMING: 'Upcoming', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };
  const formatLabel: Record<string, string> = { LEAGUE: 'League', KNOCKOUT: 'Knockout', GROUP_KNOCKOUT: 'Group + Knockout', BILATERAL: 'Bilateral Series' };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-sm mx-auto space-y-6 pt-8">
        {/* Tournament header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cricket-green/20 text-cricket-green">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{tournament.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatLabel[tournament.format] ?? tournament.format} · {statusLabel[tournament.status] ?? tournament.status}
            </p>
          </div>
        </div>

        {/* Teams already registered */}
        {tournament.teams.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">Teams ({tournament.teams.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-0">
              {tournament.teams.map((tt: any) => (
                <div key={tt.team.id} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tt.team.color }} />
                  <span className="text-sm">{tt.team.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Join section */}
        {session?.user ? (
          <Card>
            <CardHeader><CardTitle className="text-base">Register your team</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {eligibleTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {myTeams.length === 0
                    ? 'You have no teams yet. Create a team first.'
                    : 'All your teams are already in this tournament.'}
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {eligibleTeams.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTeamId(t.id)}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          selectedTeamId === t.id
                            ? 'border-cricket-green bg-cricket-green/10'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="flex-1 text-sm font-medium">{t.name}</span>
                        <span className="text-xs text-muted-foreground">
                          <Users className="inline h-3.5 w-3.5 mr-0.5" />{t._count?.players ?? t.players?.length ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    className="w-full bg-cricket-green hover:bg-cricket-green/90"
                    disabled={!selectedTeamId || joining}
                    onClick={handleJoin}
                  >
                    {joining ? 'Registering…' : 'Register Team'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Sign in to register your team for this tournament.</p>
              <Button
                className="bg-cricket-green hover:bg-cricket-green/90"
                onClick={() => router.push(`/login?callbackUrl=/join/tournament/${token}`)}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
