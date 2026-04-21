'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface LiveMatchUpdaterProps {
  matchId: string;
}

export function LiveMatchUpdater({ matchId }: LiveMatchUpdaterProps) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();

    // Polling fallback every 4s — guarantees updates even if SSE fails
    const poll = setInterval(refresh, 4000);

    // SSE for instant delivery on top of polling
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/matches/${matchId}/live`);
      es.addEventListener('update', refresh);
      es.addEventListener('completed', refresh);
      // On SSE error, clear poll interval to a faster rate so we catch up quickly
      es.onerror = () => {
        clearInterval(poll);
        // will reconnect automatically; poll is still running
      };
    } catch {
      // EventSource not supported — polling is the fallback
    }

    return () => {
      clearInterval(poll);
      es?.close();
    };
  }, [matchId, router]);

  return null;
}

