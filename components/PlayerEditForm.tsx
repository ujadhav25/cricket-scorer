'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { Lock } from 'lucide-react';
import { updatePlayerProfile } from '@/app/actions/updatePlayerProfile';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  battingStyle: z.enum(['Right', 'Left'], { message: 'Batting style is required' }),
  bowlingStyle: z.enum(['Fast', 'Medium', 'Spin'], { message: 'Bowling style is required' }),
});
type FormData = z.infer<typeof schema>;

interface Props {
  id: string;
  defaultValues: FormData;
  email: string;
}

export function PlayerEditForm({ id, defaultValues, email }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const result = await updatePlayerProfile(id, data);
      if (result.error) throw new Error(result.error);
      toast({ title: 'Profile saved!', variant: 'success' });
      // Ensure player view is active after completing profile (overrides any stale organizer cookie)
      const oneYear = 60 * 60 * 24 * 365;
      const secure = window.location.protocol === 'https:' ? '; secure' : '';
      document.cookie = `view-mode=player; path=/; max-age=${oneYear}; samesite=lax${secure}`;
      window.location.href = `/players/${result.playerId ?? id}`;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Player</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All fields are required</p>
      </div>
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="flex items-center gap-1.5">
                Email <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input
                value={email}
                disabled
                className="mt-1 bg-muted/40 text-muted-foreground cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-muted-foreground">Linked to your login account</p>
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input {...register('name')} className="mt-1" />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input {...register('phone')} placeholder="+91 98765 43210" className="mt-1" />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Batting Style *</Label>
                <Select
                  value={watch('battingStyle')}
                  onValueChange={(v) => setValue('battingStyle', v as 'Right' | 'Left', { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right">Right Hand</SelectItem>
                    <SelectItem value="Left">Left Hand</SelectItem>
                  </SelectContent>
                </Select>
                {errors.battingStyle && <p className="mt-1 text-xs text-destructive">{errors.battingStyle.message}</p>}
              </div>
              <div>
                <Label>Bowling Style *</Label>
                <Select
                  value={watch('bowlingStyle')}
                  onValueChange={(v) => setValue('bowlingStyle', v as 'Fast' | 'Medium' | 'Spin', { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fast">Fast</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Spin">Spin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bowlingStyle && <p className="mt-1 text-xs text-destructive">{errors.bowlingStyle.message}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-cricket-green hover:bg-cricket-green/90"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
