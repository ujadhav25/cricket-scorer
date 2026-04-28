'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { analytics } from '@/lib/analytics';

const schema = z.object({
  overs: z.number({ message: 'Enter number of overs' }).int().min(1).max(50),
  venue: z.string().optional(),
  tossWinner: z.string().optional(),
  tossDecision: z.enum(['bat', 'field']).optional(),
  matchType: z.string().optional(),
  tournamentId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function EditMatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { overs: 20, matchType: 'Friendly' },
  });

  const tossWinner = watch('tossWinner');
  const tossDecision = watch('tossDecision');

  useEffect(() => {
    Promise.all([
      fetch(`/api/matches/${params.id}`).then((r) => r.json()),
      fetch('/api/tournaments').then((r) => r.json()),
    ]).then(([m, trn]) => {
      setMatch(m);
      setTournaments(trn);
      reset({
        overs: m.overs,
        venue: m.venue ?? '',
        tossWinner: m.tossWinner ?? '',
        tossDecision: m.tossDecision ?? 'bat',
        matchType: m.matchType ?? 'Friendly',
        tournamentId: m.tournamentId ?? 'none',
      });
    });
  }, [params.id]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    analytics.formSubmit('edit_match');
    try {
      const res = await fetch(`/api/matches/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tournamentId: data.tournamentId === 'none' ? null : data.tournamentId,
        }),
      });
      if (!res.ok) throw new Error('Failed to update match');
      toast({ title: 'Match updated!', variant: 'success' });
      analytics.matchUpdated();
      analytics.formSuccess('edit_match');
      router.push(`/matches/${params.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      analytics.formError('edit_match', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!match) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Match</h1>
        <p className="text-muted-foreground text-sm mt-1">{match.teamA?.name} vs {match.teamB?.name}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label>Overs</Label>
          <Input
            type="number"
            min={1}
            max={50}
            className="mt-1"
            {...register('overs', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label>Venue (optional)</Label>
          <Input className="mt-1" placeholder="Ground name" {...register('venue')} />
        </div>

        <div>
          <Label>Match Type</Label>
          <Select value={watch('matchType')} onValueChange={(v) => setValue('matchType', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Friendly">Friendly</SelectItem>
              <SelectItem value="Tournament">Tournament</SelectItem>
              <SelectItem value="Practice">Practice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tournament (optional)</Label>
          <Select value={watch('tournamentId') ?? 'none'} onValueChange={(v) => setValue('tournamentId', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="No tournament" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Tournament</SelectItem>
              {tournaments.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Toss Winner</Label>
          <Select value={tossWinner} onValueChange={(v) => setValue('tossWinner', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={match.teamAId}>{match.teamA?.name}</SelectItem>
              <SelectItem value={match.teamBId}>{match.teamB?.name}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Toss Decision</Label>
          <div className="flex gap-2 mt-1">
            {['bat', 'field'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setValue('tossDecision', d as 'bat' | 'field')}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold capitalize transition-colors ${
                  tossDecision === d
                    ? 'border-cricket-green bg-cricket-green/10 text-cricket-green'
                    : 'border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-cricket-green hover:bg-cricket-green/90" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
