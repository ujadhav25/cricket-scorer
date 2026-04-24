'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

interface Player {
  id: string;
  name: string;
}

interface MotmPickerProps {
  matchId: string;
  players: Player[];
  currentMotmId: string | null;
}

export function MotmPicker({ matchId, players, currentMotmId }: MotmPickerProps) {
  const [selected, setSelected] = useState<string | null>(currentMotmId);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function pick(playerId: string) {
    const newId = selected === playerId ? null : playerId;
    setSelected(newId);
    setOpen(false);
    startTransition(async () => {
      await fetch(`/api/matches/${matchId}/motm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: newId }),
      });
      router.refresh();
    });
  }

  const motmPlayer = players.find((p) => p.id === selected);

  return (
    <div className="relative">
      {motmPlayer ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">{motmPlayer.name}</span>
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-400 hover:border-amber-500/70 transition-colors"
        >
          <Star className="h-4 w-4" />
          Pick Player of the Match
        </button>
      )}

      {open && (
        <div className="absolute top-full mt-2 left-0 z-20 w-64 rounded-xl border border-border bg-card shadow-xl">
          <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Player of the Match
          </p>
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                disabled={isPending}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                  selected === p.id
                    ? 'bg-amber-500/15 text-amber-300 font-semibold'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                {selected === p.id && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <div className="p-1.5 pt-0">
            <button
              onClick={() => setOpen(false)}
              className="w-full rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
