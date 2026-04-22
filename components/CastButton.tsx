'use client';

import { useState, useEffect, useRef } from 'react';
import { Monitor, Tv2, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CastButtonProps {
  matchId: string;
}

export function CastButton({ matchId }: CastButtonProps) {
  const [presentationSupported, setPresentationSupported] = useState(false);
  const [casting, setCasting] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const castUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/matches/${matchId}/cast`
    : `/matches/${matchId}/cast`;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'PresentationRequest' in window) {
      setPresentationSupported(true);
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleOpenTab() {
    setOpen(false);
    window.open(castUrl, '_blank');
  }

  async function handleCastToTV() {
    setOpen(false);
    try {
      setCasting(true);
      // @ts-ignore
      const request = new window.PresentationRequest([castUrl]);
      const connection = await request.start();
      connection.addEventListener('close', () => setCasting(false));
      connection.addEventListener('terminate', () => setCasting(false));
    } catch {
      window.open(castUrl, '_blank');
      setCasting(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenTab}
          className={presentationSupported ? 'rounded-r-none border-r-0' : ''}
          title="Open full-screen scoreboard"
        >
          <Monitor className="mr-1.5 h-4 w-4" />Cast
        </Button>

        {presentationSupported && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-l-none px-2"
            onClick={() => setOpen((v) => !v)}
            title="More cast options"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <button
            onClick={handleOpenTab}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            Open in new tab
          </button>
          <button
            onClick={handleCastToTV}
            disabled={casting}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <Tv2 className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <div>{casting ? 'Finding devices…' : 'Cast to Chromecast'}</div>
              <div className="text-[10px] text-muted-foreground">Requires Chromecast on same Wi-Fi</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
