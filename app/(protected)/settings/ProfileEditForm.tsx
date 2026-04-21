'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';

interface Props {
  initialName: string;
  initialPhone: string;
}

export default function ProfileEditForm({ initialName, initialPhone }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Update failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Profile updated', variant: 'success' });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Display name</p>
          <p className="font-medium">{name || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="font-medium">{phone || '—'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="name">Display Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="bg-cricket-green hover:bg-cricket-green/90" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  );
}
