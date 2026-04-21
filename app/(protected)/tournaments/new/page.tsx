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
import { cn } from '@/lib/utils';
import { Check, Plus } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Tournament name required'),
  format: z.enum(['LEAGUE', 'KNOCKOUT', 'GROUP_KNOCKOUT', 'BILATERAL']),
  defaultOvers: z.number().int().min(1).max(50),
  totalMatches: z.number().int().min(1).max(9).default(3),
  description: z.string().optional(),
  teamIds: z.array(z.string()).min(2, 'Add at least 2 teams'),
});
type FormData = z.infer<typeof schema>;

export default function NewTournamentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('LEAGUE');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { format: 'LEAGUE', defaultOvers: 20, totalMatches: 3, teamIds: [] },
  });

  useEffect(() => { fetch('/api/teams').then((r) => r.json()).then(setTeams); }, []);

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      setValue('teamIds', next);
      return next;
    });
  }

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create tournament');
      const tournament = await res.json();
      // Auto-generate fixtures
      await fetch(`/api/tournaments/${tournament.id}/fixtures`, { method: 'PUT' });
      toast({ title: 'Tournament created! Fixtures generated.', variant: 'success' });
      router.push(`/tournaments/${tournament.id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">New Tournament</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tournament Name *</Label>
              <Input {...register('name')} placeholder="Premier League 2026" className="mt-1" />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Format</Label>
              <Select onValueChange={(v) => { setValue('format', v as any); setSelectedFormat(v); }} defaultValue="LEAGUE">
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAGUE">League (Round Robin)</SelectItem>
                  <SelectItem value="KNOCKOUT">Knockout</SelectItem>
                  <SelectItem value="GROUP_KNOCKOUT">Group + Knockout</SelectItem>
                  <SelectItem value="BILATERAL">Bilateral Series</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedFormat === 'BILATERAL' && (
              <div>
                <Label>Number of Matches</Label>
                <Select onValueChange={(v) => setValue('totalMatches', Number(v))} defaultValue="3">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}-match series</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Exactly 2 teams required. Most wins takes the series.</p>
              </div>
            )}
            <div>
              <Label>Overs per Match</Label>
              <Input type="number" min={1} max={50} {...register('defaultOvers', { valueAsNumber: true })} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Input {...register('description')} placeholder="Annual club championship" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Teams ({selectedTeamIds.length} selected)</CardTitle></CardHeader>
          <CardContent>
            {errors.teamIds && <p className="mb-2 text-xs text-destructive">{errors.teamIds.message}</p>}
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams yet. <a href="/teams/new" className="text-cricket-green hover:underline">Create teams first</a></p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {teams.map((t) => (
                  <button key={t.id} type="button" onClick={() => toggleTeam(t.id)}
                    className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      selectedTeamIds.includes(t.id) ? 'border-cricket-green bg-cricket-green/10' : 'border-border hover:border-muted-foreground')}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: t.color }}>
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium">{t.name}</span>
                    {selectedTeamIds.includes(t.id) && <Check className="h-4 w-4 text-cricket-green" />}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="flex-1 bg-cricket-green hover:bg-cricket-green/90" disabled={saving}>
            <Plus className="mr-2 h-4 w-4" />{saving ? 'Creating…' : 'Create & Generate Fixtures'}
          </Button>
        </div>
      </form>
    </div>
  );
}
