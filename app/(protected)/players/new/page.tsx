'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isContactsAPISupported, requestContacts } from '@/lib/contacts';
import { useToast } from '@/components/ui/toaster';
import { ContactRound, Plus } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  battingStyle: z.enum(['Right', 'Left']),
  bowlingStyle: z.enum(['Fast', 'Medium', 'Spin']),
});
type FormData = z.infer<typeof schema>;

export default function NewPlayerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [contactsSupported, setContactsSupported] = useState<boolean | null>(null);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { battingStyle: 'Right', bowlingStyle: 'Medium' },
  });

  async function checkContacts() {
    const supported = await isContactsAPISupported();
    setContactsSupported(supported);
    if (!supported) {
      toast({ title: 'Contacts API not supported', description: 'Use manual form to add player', variant: 'destructive' });
      return;
    }
    try {
      const contacts = await requestContacts();
      if (contacts.length > 0) {
        setValue('name', contacts[0].name ?? '');
        setValue('phone', contacts[0].phone ?? '');
        toast({ title: 'Contact imported', variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Failed to import contact', description: err.message, variant: 'destructive' });
    }
  }

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create player');
      toast({ title: 'Player added!', variant: 'success' });
      router.push('/players');
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Player</h1>
        <p className="text-muted-foreground">Create a new player profile</p>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Import from contacts */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Import from Contacts</p>
              <p className="text-sm text-muted-foreground">Pick a contact from your device</p>
            </div>
            <Button variant="outline" onClick={checkContacts}>
              <ContactRound className="mr-2 h-4 w-4" />
              Import
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Player Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...register('name')} placeholder="Virat Kohli" className="mt-1" />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register('phone')} placeholder="+91 98765 43210" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Batting Style</Label>
                  <Select onValueChange={(v) => setValue('battingStyle', v as 'Right' | 'Left')} defaultValue="Right">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Right">Right Hand</SelectItem>
                      <SelectItem value="Left">Left Hand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bowling Style</Label>
                  <Select onValueChange={(v) => setValue('bowlingStyle', v as 'Fast' | 'Medium' | 'Spin')} defaultValue="Medium">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fast">Fast</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Spin">Spin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-cricket-green hover:bg-cricket-green/90" disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" />
                  {saving ? 'Saving…' : 'Add Player'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
