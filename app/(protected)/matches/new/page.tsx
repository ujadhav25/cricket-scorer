'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { Users } from 'lucide-react';
import { analytics } from '@/lib/analytics';

const schema = z.object({
  teamAId: z.string().min(1, 'Select Team A'),
  teamBId: z.string().min(1, 'Select Team B'),
  overs: z.number({ message: 'Enter number of overs' }).int().min(1, 'Min 1 over').max(50, 'Max 50 overs'),
  venue: z.string().optional(),
  tossWinner: z.string().min(1, 'Select toss winner'),
  tossDecision: z.enum(['bat', 'field'], { message: 'Select bat or field' }),
  matchType: z.string().optional(),
  tournamentId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [playingXI_A, setPlayingXI_A] = useState<string[]>([]);
  const [playingXI_B, setPlayingXI_B] = useState<string[]>([]);

  const togglePlayer = (teamId: 'A' | 'B', playerId: string) => {
    const setter = teamId === 'A' ? setPlayingXI_A : setPlayingXI_B;
    const current = teamId === 'A' ? playingXI_A : playingXI_B;
    const other = teamId === 'A' ? playingXI_B : playingXI_A;
    if (other.includes(playerId)) return;
    if (current.includes(playerId)) {
      setter(current.filter((id) => id !== playerId));
    } else if (current.length < 11) {
      setter([...current, playerId]);
    }
  };

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { overs: 20, matchType: 'Friendly', teamAId: '', teamBId: '', tossWinner: '', venue: '' },
  });

  const teamAId = watch('teamAId');
  const teamBId = watch('teamBId');
  const tossWinner = watch('tossWinner');
  const tossDecision = watch('tossDecision');

  const isFormComplete = !!(teamAId && teamBId && teamAId !== teamBId && tossWinner && tossDecision);

  useEffect(() => {
    Promise.all([
      fetch('/api/teams').then((r) => r.json()),
      fetch('/api/tournaments').then((r) => r.json()),
    ]).then(([t, trn]) => { setTeams(t); setTournaments(trn); });
  }, []);

  async function onSubmit(data: FormData) {
    if (data.teamAId === data.teamBId) {
      toast({ title: 'Teams must be different', variant: 'destructive' });
      return;
    }
    setSaving(true);
    analytics.formSubmit('create_match');
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tournamentId: data.tournamentId === 'none' ? undefined : data.tournamentId,
          playingXI_A: playingXI_A.length > 0 ? playingXI_A : undefined,
          playingXI_B: playingXI_B.length > 0 ? playingXI_B : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create match');
      const match = await res.json();
      toast({ title: 'Match created!', variant: 'success' });
      analytics.matchCreated(data.overs, !!data.tournamentId && data.tournamentId !== 'none');
      analytics.formSuccess('create_match');
      router.push(`/matches/${match.id}/score`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      analytics.formError('create_match', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">New Match</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">        {/* Playing XI — shown when both teams selected */}
        {teamAId && teamBId && teamAId !== teamBId && (() => {
          const teamA = teams.find((t) => t.id === teamAId);
          const teamB = teams.find((t) => t.id === teamBId);
          if (!teamA?.players?.length && !teamB?.players?.length) return null;
          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Playing XI <span className="text-xs font-normal text-muted-foreground">(optional, max 11)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[{ team: teamA, xi: playingXI_A, side: 'A' as const, otherXi: playingXI_B }, { team: teamB, xi: playingXI_B, side: 'B' as const, otherXi: playingXI_A }].map(({ team, xi, side, otherXi }) => (
                  <div key={team.id}>
                    <p className="text-sm font-semibold mb-2">{team.name} <span className="text-xs text-muted-foreground font-normal">({xi.length}/11)</span></p>
                    <div className="flex flex-wrap gap-2">
                      {team.players?.map((tp: any) => {
                        const p = tp.player ?? tp;
                        const selected = xi.includes(p.id);
                        const inOtherTeam = otherXi.includes(p.id);
                        const disabled = inOtherTeam || (!selected && xi.length >= 11);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePlayer(side, p.id)}
                            disabled={disabled}
                            title={inOtherTeam ? 'Already in the other team' : undefined}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              selected
                                ? 'bg-cricket-green text-white border-cricket-green'
                                : inOtherTeam
                                ? 'border-border text-muted-foreground opacity-30 cursor-not-allowed line-through'
                                : xi.length >= 11
                                ? 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                                : 'border-border hover:border-cricket-green/50'
                            }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })()}
        <Card>
          <CardHeader><CardTitle className="text-base">Teams</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Team A *</Label>
              <Select onValueChange={(v) => setValue('teamAId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.filter((t) => t.id !== teamBId).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>

            </div>
            <div>
              <Label>Team B *</Label>
              <Select onValueChange={(v) => setValue('teamBId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.filter((t) => t.id !== teamAId).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Match Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Overs</Label>
              <Input type="number" min={1} max={50} {...register('overs', { valueAsNumber: true })} className="mt-1" />
            </div>
            <div>
              <Label>Venue</Label>
              <Input {...register('venue')} placeholder="Eden Gardens" className="mt-1" />
            </div>
            <div>
              <Label>Match Type</Label>
              <Select onValueChange={(v) => setValue('matchType', v)} defaultValue="Friendly">
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Tournament">Tournament</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tournaments.length > 0 && (
              <div>
                <Label>Tournament (optional)</Label>
                <Select onValueChange={(v) => setValue('tournamentId', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {tournaments.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Toss</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Toss Winner *</Label>
              <Select onValueChange={(v) => setValue('tossWinner', v, { shouldValidate: true })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {teamAId && <SelectItem value={teamAId}>{teams.find((t) => t.id === teamAId)?.name ?? 'Team A'}</SelectItem>}
                  {teamBId && <SelectItem value={teamBId}>{teams.find((t) => t.id === teamBId)?.name ?? 'Team B'}</SelectItem>}
                </SelectContent>
              </Select>

            </div>
            <div>
              <Label>Decision *</Label>
              <Select onValueChange={(v) => setValue('tossDecision', v as 'bat' | 'field', { shouldValidate: true })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Bat / Field" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bat">Bat</SelectItem>
                  <SelectItem value="field">Field</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="flex-1 bg-cricket-green hover:bg-cricket-green/90" disabled={saving || !isFormComplete}>
            {saving ? 'Creating…' : 'Start Match'}
          {/* disabled until required fields filled */}
          </Button>
        </div>
      </form>
    </div>
  );
}
