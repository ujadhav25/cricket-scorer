'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  overs: z.preprocess((v) => Number(v), z.number().min(1).max(50)),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Tournament {
  id: string;
  name: string;
  overs: number;
  format: string;
  startDate: string | null;
  endDate: string | null;
}

export default function TournamentEditClient({ tournament }: { tournament: Tournament }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: tournament.name,
      overs: tournament.overs,
      startDate: tournament.startDate ? tournament.startDate.slice(0, 10) : '',
      endDate: tournament.endDate ? tournament.endDate.slice(0, 10) : '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    const toISO = (d?: string) => (d ? new Date(d).toISOString() : undefined);
    const res = await fetch(`/api/tournaments/${tournament.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        defaultOvers: data.overs,
        startDate: toISO(data.startDate) ?? null,
        endDate: toISO(data.endDate) ?? null,
      }),
    });
    if (!res.ok) {
      toast({ title: 'Update failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Tournament updated', variant: 'success' });
    router.push(`/tournaments/${tournament.id}`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this tournament? All associated matches will also be deleted.')) return;
    setDeleting(true);
    const res = await fetch(`/api/tournaments/${tournament.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast({ title: 'Delete failed', variant: 'destructive' });
      setDeleting(false);
      return;
    }
    toast({ title: 'Tournament deleted', variant: 'success' });
    router.push('/tournaments');
    router.refresh();
  };

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Edit Tournament</h1>
        <p className="text-sm text-muted-foreground">{tournament.format}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tournament Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Tournament Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="overs">Overs per innings</Label>
              <Input id="overs" type="number" {...register('overs')} />
              {errors.overs && <p className="text-xs text-destructive">{errors.overs.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(['startDate', 'endDate'] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label>{field === 'startDate' ? 'Start Date' : 'End Date'}</Label>
                  <Controller
                    control={control}
                    name={field}
                    render={({ field: f }) => {
                      const selected = f.value ? parseISO(f.value) : undefined;
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !f.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {f.value ? format(parseISO(f.value), 'dd MMM yyyy') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(date) => f.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-cricket-green hover:bg-cricket-green/90">
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader><CardTitle className="text-base text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete Tournament'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
