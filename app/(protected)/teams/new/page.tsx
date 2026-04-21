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
import { useToast } from '@/components/ui/toaster';
import { getInitials } from '@/lib/utils';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Team name is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  homeGround: z.string().optional(),
  playerIds: z.array(z.string()).min(2, 'Select at least 2 players').max(15, 'Max 15 players'),
});
type FormData = z.infer<typeof schema>;

const PRESET_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d'];

export default function NewTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: PRESET_COLORS[0], playerIds: [] },
  });

  useEffect(() => {
    fetch('/api/players').then((r) => r.json()).then(setPlayers);
  }, []);

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      setValue('playerIds', next);
      return next;
    });
  }

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, color: selectedColor }),
      });
      if (!res.ok) throw new Error('Failed to create team');
      toast({ title: 'Team created!', variant: 'success' });
      router.push('/teams');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create Team</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Team Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Team Name *</Label>
              <Input {...register('name')} placeholder="Mumbai Indians" className="mt-1" />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Home Ground</Label>
              <Input {...register('homeGround')} placeholder="Wankhede Stadium" className="mt-1" />
            </div>
            <div>
              <Label className="mb-2 block">Team Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { setSelectedColor(color); setValue('color', color); }}
                    className={cn('h-9 w-9 rounded-full transition-all', selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-background')}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input type="color" value={selectedColor} onChange={(e) => { setSelectedColor(e.target.value); setValue('color', e.target.value); }} className="h-9 w-9 cursor-pointer rounded-full border-0" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Select Players ({selectedPlayerIds.length}/15)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errors.playerIds && <p className="mb-2 text-xs text-destructive">{errors.playerIds.message}</p>}
            {players.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No players yet.{' '}
                <a href="/players/new" className="text-cricket-green hover:underline">Add players first</a>
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlayer(p.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 transition-colors text-left',
                      selectedPlayerIds.includes(p.id)
                        ? 'border-cricket-green bg-cricket-green/10'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {getInitials(p.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.battingStyle} bat · {p.bowlingStyle} bowl</p>
                    </div>
                    {selectedPlayerIds.includes(p.id) && <Check className="h-4 w-4 text-cricket-green" />}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="flex-1 bg-cricket-green hover:bg-cricket-green/90" disabled={saving}>
            <Plus className="mr-2 h-4 w-4" />{saving ? 'Creating…' : 'Create Team'}
          </Button>
        </div>
      </form>
    </div>
  );
}
