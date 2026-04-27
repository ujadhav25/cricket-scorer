'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export function RemovePlayerButton({ teamId, playerId }: { teamId: string; playerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm('Remove this player from the team?')) return;
    setLoading(true);
    await fetch(`/api/teams/${teamId}/players/${playerId}`, { method: 'DELETE' });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); handleRemove(); }}
      disabled={loading}
      className="ml-auto shrink-0 rounded-full p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
      title="Remove from team"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
