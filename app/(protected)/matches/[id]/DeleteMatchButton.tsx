'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { Trash2 } from 'lucide-react';
import { analytics } from '@/lib/analytics';

export default function DeleteMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this match? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete match');
      toast({ title: 'Match deleted', variant: 'success' });
      analytics.matchDeleted();
      router.push('/matches');
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
      <Trash2 className="mr-2 h-4 w-4" />
      {deleting ? 'Deleting…' : 'Delete Match'}
    </Button>
  );
}
