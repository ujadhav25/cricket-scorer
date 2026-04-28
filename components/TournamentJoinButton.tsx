'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Link2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analytics } from '@/lib/analytics';

interface TournamentJoinButtonProps {
  joinToken: string;
  tournamentName: string;
}

export function TournamentJoinButton({ joinToken, tournamentName }: TournamentJoinButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/join/tournament/${joinToken}`
    : `/join/tournament/${joinToken}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    analytics.linkCopied('tournament_join');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ title: tournamentName, text: `Register your team for ${tournamentName}`, url });
      analytics.nativeShareTriggered('tournament_join');
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-xl"
        onClick={() => { setOpen(true); analytics.shareOpened('tournament_join'); }}
      >
        <Link2 className="h-4 w-4" /> Join Link
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1a0d] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-white">Tournament Join Link</h2>
              <button onClick={() => { setOpen(false); analytics.shareDismissed('tournament_join'); }} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-white/70 text-center">
              Share this link so team captains can register for{' '}
              <span className="text-white font-semibold">{tournamentName}</span>
            </p>

            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-4">
                <QRCode value={url} size={180} />
              </div>
            </div>

            <p className="text-center text-xs text-white/40">Scan to register a team</p>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="flex-1 text-xs text-white/60 truncate">{url}</p>
              <button onClick={handleCopy} className="shrink-0 text-white/50 hover:text-white transition-colors">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {copied && <p className="text-center text-xs text-green-400">Link copied!</p>}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="h-10 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition"
              >
                Copy Link
              </button>
              {'share' in navigator ? (
                <button
                  onClick={handleNativeShare}
                  className="h-10 rounded-xl bg-cricket-green text-black text-sm font-bold hover:opacity-90 transition"
                >
                  Share via App
                </button>
              ) : (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Register your team for ${tournamentName}: ${url}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 rounded-xl bg-green-600 text-white text-sm font-bold hover:opacity-90 transition"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
