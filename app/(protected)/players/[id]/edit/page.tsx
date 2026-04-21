'use client';

import { useEffect, useState } from 'react';
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
import { Trash2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  battingStyle: z.enum(['Right', 'Left']),
  bowlingStyle: z.enum(['Fast', 'Medium', 'Spin']),
});
type FormData = z.infer<typeof schema>;

export default function EditPlayerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((r) => r.json())
      .then((p) => {
        reset({ name: p.name, phone: p.phone ?? '', battingStyle: p.battingStyle, bowlingStyle: p.bowlingStyle });
        setLoaded(true);
      });
  }, [id, reset]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast({ title: 'Player updated!', variant: 'success' });
      router.push(`/players/${id}`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this player? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Player deleted', variant: 'success' });
      router.push('/players');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  if (!loaded) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Player</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="mr-2 h-4 w-4" />{deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input {...register('name')} className="mt-1" />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input {...register('phone')} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Batting Style</Label>
                <Select defaultValue={watch('battingStyle')} onValueChange={(v) => setValue('battingStyle', v as 'Right' | 'Left')}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right">Right Hand</SelectItem>
                    <SelectItem value="Left">Left Hand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bowling Style</Label>
                <Select defaultValue={watch('bowlingStyle')} onValueChange={(v) => setValue('bowlingStyle', v as 'Fast' | 'Medium' | 'Spin')}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fast">Fast</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Spin">Spin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-cricket-green hover:bg-cricket-green/90" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
