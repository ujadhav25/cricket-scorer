'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareTournamentButtonProps {
  shareToken: string;
  tournamentName: string;
}

export function ShareTournamentButton({ shareToken, tournamentName }: ShareTournamentButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${shareToken}`
    : `/t/${shareToken}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ title: tournamentName, text: `Follow the tournament: ${tournamentName}`, url });
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-xl border-cricket-green/40 text-cricket-green hover:bg-cricket-green/10"
        onClick={() => setOpen(true)}
      >
        <Share2 className="h-4 w-4" /> Share
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1a0d] p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Share Tournament</h2>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-white/60">{tournamentName}</p>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-4">
                <QRCode value={url} size={180} />
              </div>
            </div>

            <p className="text-center text-xs text-white/40">Scan to view tournament</p>

            {/* URL */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="flex-1 text-xs text-white/60 truncate">{url}</p>
              <button
                onClick={handleCopy}
                className="shrink-0 text-white/50 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {copied && <p className="text-center text-xs text-green-400">Link copied!</p>}

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="h-10 rounded-xl border border-white/15 text-sm font-semibold hover:bg-white/5 transition"
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
                  href={`https://wa.me/?text=${encodeURIComponent(`Follow the tournament: ${tournamentName} — ${url}`)}`}
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
