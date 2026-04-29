'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getPusherClient } from '@/lib/pusher';

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number; // % from left
}

const REACTIONS = ['🔥', '💥', '👏', '😱', '🏏', '⭐'];
const REACTION_EVENT = 'reaction';

export function LiveReactions({ matchId, initialCounts = {} }: { matchId: string; initialCounts?: Record<string, number> }) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [cooldown, setCooldown] = useState(false);
  const idRef = useRef(0);

  const addFloat = useCallback((emoji: string) => {
    const id = ++idRef.current;
    const x = 10 + Math.random() * 80;
    setFloating((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloating((prev) => prev.filter((f) => f.id !== id)), 2200);
  }, []);

  // Keep counts fresh — re-fetch from DB in case initialCounts was stale
  useEffect(() => {
    fetch(`/api/matches/${matchId}/reaction`)
      .then((r) => r.json())
      .then((data: { counts?: Record<string, number> }) => {
        if (data.counts && Object.keys(data.counts).length > 0) {
          setCounts(data.counts);
        }
      })
      .catch(() => {});
  }, [matchId]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`match-${matchId}`);

    channel.bind(REACTION_EVENT, (data: { emoji: string; count?: number }) => {
      addFloat(data.emoji);
      // Use server count if provided, else increment locally
      setCounts((prev) => ({ ...prev, [data.emoji]: data.count ?? (prev[data.emoji] ?? 0) + 1 }));
    });

    return () => {
      channel.unbind(REACTION_EVENT);
      pusher.unsubscribe(`match-${matchId}`);
    };
  }, [matchId, addFloat]);

  async function sendReaction(emoji: string) {
    if (cooldown) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1500);

    // Optimistic local float + count
    addFloat(emoji);
    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));

    try {
      const res = await fetch(`/api/matches/${matchId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      // Reconcile with server's authoritative count
      if (typeof data.count === 'number') setCounts((prev) => ({ ...prev, [emoji]: data.count }));
    } catch {
      // non-fatal
    }
  }

  return (
    <>
      {/* Floating emojis — fixed over the whole page */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {floating.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-16 text-3xl animate-float-up"
            style={{ left: `${f.x}%` }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Fixed reaction bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-3 bg-black/80 backdrop-blur-md border-t border-white/10">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onMouseDown={() => sendReaction(emoji)}
            onTouchStart={() => sendReaction(emoji)}
            disabled={cooldown}
            className="relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl border border-white/10 bg-white/5 text-2xl transition-all active:scale-90 hover:bg-white/15 disabled:opacity-40"
          >
            <span>{emoji}</span>
            {(counts[emoji] ?? 0) > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-cricket-green text-[10px] font-bold text-black flex items-center justify-center px-1">
                {counts[emoji]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Spacer so page content doesn't hide behind fixed bar */}
      <div className="h-20" />
    </>
  );
}
