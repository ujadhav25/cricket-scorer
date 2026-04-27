'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { Plus, Check, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Team name is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  homeGround: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PRESET_COLORS = [
  '#16a34a', '#2563eb', '#dc2626', '#d97706',
  '#7c3aed', '#db2777', '#0891b2', '#ea580c',
];

export default function NewTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [hexInput, setHexInput] = useState(PRESET_COLORS[0].replace('#', '').toUpperCase());
  const colorInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: PRESET_COLORS[0] },
  });

  const teamName = watch('name');

  function applyColor(color: string) {
    setSelectedColor(color);
    setHexInput(color.replace('#', '').toUpperCase());
    setValue('color', color);
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

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, color: selectedColor }),
      });
      if (!res.ok) throw new Error('Failed to create team');
      const team = await res.json();
      toast({ title: 'Team created!', description: 'Share the invite link so players can join.', variant: 'success' });
      router.push(`/teams/${team.id}`);
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
              <Label className="mb-3 block">Team Color</Label>
              <div className="flex items-start gap-4">
                {/* Live team badge preview */}
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md transition-colors duration-200"
                  style={{ backgroundColor: selectedColor }}
                >
                  {(teamName || 'T')[0]?.toUpperCase()}
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

        <p className="text-sm text-muted-foreground">
          After creating the team, share the invite link with your players so they can sign up and join.
        </p>

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
