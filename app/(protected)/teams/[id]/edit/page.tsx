'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { getInitials, cn } from '@/lib/utils';
import { Check, Trash2, Shield, Search, Pipette } from 'lucide-react';
import { analytics } from '@/lib/analytics';

const schema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  homeGround: z.string().optional(),
  playerIds: z.array(z.string()).max(15),
  captainPlayerId: z.string().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

const PRESET_COLORS = [
  '#16a34a', '#2563eb', '#dc2626', '#d97706',
  '#7c3aed', '#db2777', '#0891b2', '#ea580c',
];

export default function EditTeamPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [hexInput, setHexInput] = useState(PRESET_COLORS[0].replace('#', '').toUpperCase());
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [captainPlayerId, setCaptainPlayerId] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  function applyColor(color: string) {
    setSelectedColor(color);
    setHexInput(color.replace('#', '').toUpperCase());
    setValue('color', color);
    analytics.teamColorPicked(color, PRESET_COLORS.includes(color) ? 'preset' : 'custom');
  }

  function handleHexInput(raw: string) {
    const cleaned = raw.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 6);
    setHexInput(cleaned);
    if (cleaned.length === 6) {
      const color = '#' + cleaned;
      setSelectedColor(color);
      setValue('color', color);
    }
  }

  useEffect(() => {
    Promise.all([fetch(`/api/teams/${id}`).then((r) => r.json()), fetch('/api/players').then((r) => r.json())]).then(
      ([team, players]) => {
        const pids = team.players.map((tp: any) => tp.player.id);
        // Find the captain's player record from team players
        const captainPlayer = team.captainUser?.id
          ? team.players.find((tp: any) => tp.player.userId === team.captainUser.id)?.player
          : null;
        const captainPid = captainPlayer?.id ?? '';
        reset({
          name: team.name,
          color: team.color,
          homeGround: team.homeGround ?? '',
          playerIds: pids,
          captainPlayerId: captainPid,
        });
        setCaptainPlayerId(captainPid);
        setSelectedColor(team.color);
        setHexInput(team.color.replace('#', '').toUpperCase());
        setSelectedPlayerIds(pids);
        setAllPlayers(players);
        setLoaded(true);
      }
    );
  }, [id, reset]);

  function togglePlayer(pid: string) {
    setSelectedPlayerIds((prev) => {
      const next = prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid];
      setValue('playerIds', next);
      // Clear captain if they're being removed from team
      if (!next.includes(captainPlayerId)) {
        setCaptainPlayerId('');
        setValue('captainPlayerId', '');
      }
      return next;
    });
  }

  async function onSubmit(data: FormData) {
    setSaving(true);
    analytics.formSubmit('edit_team');
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, color: selectedColor }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast({ title: 'Team updated!', variant: 'success' });
      analytics.teamUpdated();
      analytics.formSuccess('edit_team');
      router.push(`/teams/${id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      analytics.formError('edit_team', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this team?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      toast({ title: 'Team deleted', variant: 'success' });
      analytics.teamDeleted();
      router.push('/teams');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  if (!loaded) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Team</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="mr-2 h-4 w-4" />{deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Team Name *</Label>
              <Input {...register('name')} className="mt-1" />
            </div>
            <div>
              <Label>Home Ground</Label>
              <Input {...register('homeGround')} className="mt-1" />
            </div>
            <div>
              <Label className="mb-3 block">Color</Label>
              <div className="flex items-start gap-4">
                {/* Live team badge preview */}
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md transition-colors duration-200"
                  style={{ backgroundColor: selectedColor }}
                >
                  {(watch('name') || 'T')[0]?.toUpperCase()}
                </div>

                <div className="flex-1 space-y-3">
                  {/* Preset swatches — single row */}
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((color) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => applyColor(color)}
                          className="relative shrink-0 focus:outline-none"
                          style={{
                            display: 'block',
                            padding: 0,
                            boxSizing: 'border-box',
                            minHeight: 0,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: color,
                            transform: isSelected ? 'scale(1.15)' : undefined,
                            boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined,
                            transition: 'transform 0.15s, box-shadow 0.15s',
                          }}
                          title={color}
                        >
                          {isSelected && (
                            <Check
                              className="absolute inset-0 m-auto h-3.5 w-3.5 text-white"
                              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hex input + custom picker */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1 border border-border rounded-md px-2 py-1.5 bg-muted/30 focus-within:ring-1 focus-within:ring-ring">
                      <div className="h-4 w-4 rounded shrink-0" style={{ backgroundColor: selectedColor }} />
                      <span className="text-xs text-muted-foreground font-mono">#</span>
                      <input
                        type="text"
                        value={hexInput}
                        onChange={(e) => handleHexInput(e.target.value)}
                        maxLength={6}
                        className="w-16 text-xs font-mono bg-transparent focus:outline-none uppercase tracking-wide"
                        placeholder="16A34A"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => colorInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors shrink-0"
                    >
                      <Pipette className="h-3 w-3" />
                      Custom
                    </button>
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={selectedColor}
                      onChange={(e) => applyColor(e.target.value)}
                      className="sr-only"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Players ({selectedPlayerIds.length}/15)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search players across your teams…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allPlayers
                .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                .map((p) => (
                  <button key={p.id} type="button" onClick={() => togglePlayer(p.id)}
                    className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      selectedPlayerIds.includes(p.id) ? 'border-cricket-green bg-cricket-green/10' : 'border-border hover:border-muted-foreground')}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0">{getInitials(p.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {(p as any).teamPlayers?.map((tp: any) => (
                          <span key={tp.team.id} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{tp.team.name}</span>
                        ))}
                      </div>
                    </div>
                    {selectedPlayerIds.includes(p.id) && <Check className="h-4 w-4 text-cricket-green shrink-0" />}
                  </button>
                ))}
              {allPlayers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No players found. Invite players via your team invite link.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedPlayerIds.length >= 2 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Captain</CardTitle></CardHeader>
            <CardContent>
              <Select value={captainPlayerId} onValueChange={(v) => { const val = v === 'none' ? '' : v; setCaptainPlayerId(val); setValue('captainPlayerId', val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select captain (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No captain</SelectItem>
                  {allPlayers.filter((p) => selectedPlayerIds.includes(p.id)).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">The captain can manage the player roster</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="flex-1 bg-cricket-green hover:bg-cricket-green/90" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
}
