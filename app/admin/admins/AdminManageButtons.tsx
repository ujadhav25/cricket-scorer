'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus, X } from 'lucide-react';

interface AddProps {
  mode: 'add';
}
interface RemoveProps {
  mode: 'remove';
  adminId: string;
  adminEmail: string;
}
type Props = AddProps | RemoveProps;

export function AdminManageButtons(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');

  if (props.mode === 'remove') {
    function handleRemove() {
      if (!confirm(`Remove admin access for ${props.adminEmail}?`)) return;
      startTransition(async () => {
        const res = await fetch('/api/admin/admins', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: (props as RemoveProps).adminId }),
        });
        if (res.ok) router.refresh();
      });
    }

    return (
      <button
        disabled={isPending}
        onClick={handleRemove}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        title="Remove admin access"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, department: department || undefined }),
      });
      if (res.ok) {
        setEmail('');
        setName('');
        setDepartment('');
        setShowForm(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to add admin');
      }
    });
  }

  if (!showForm) {
    return (
      <Button
        size="sm"
        onClick={() => setShowForm(true)}
        className="gap-1.5 bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
        variant="outline"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add Admin
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border/30 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Add Admin User</h2>
          <button onClick={() => { setShowForm(false); setError(''); }} className="p-1 rounded hover:bg-muted/30">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Google Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Department (optional)</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Operations, Finance"
              className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setShowForm(false); setError(''); }}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
              {isPending ? 'Adding…' : 'Add Admin'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
