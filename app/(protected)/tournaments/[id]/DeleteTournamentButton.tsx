'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';

export default function DeleteTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this tournament? All associated matches will also be deleted.')) return;
    setLoading(true);
    const res = await fetch(`/api/tournaments/${tournamentId}`, { method: 'DELETE' });
    if (!res.ok) {
      toast({ title: 'Delete failed', variant: 'destructive' });
      setLoading(false);
      return;
    }
    toast({ title: 'Tournament deleted', variant: 'success' });
    router.push('/tournaments');
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="border-destructive/50 text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
