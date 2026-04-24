'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareMatchButtonProps {
  shareToken: string;
  matchTitle: string;
}

export function ShareMatchButton({ shareToken, matchTitle }: ShareMatchButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/m/${shareToken}`
    : `/m/${shareToken}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ title: matchTitle, text: `Watch live score: ${matchTitle}`, url });
    }
  }

  async function handleCopyEmbed() {
    const code = `<iframe src="${window.location.origin}/embed/${shareToken}" width="320" height="120" frameborder="0" style="border-radius:12px;overflow:hidden;" title="${matchTitle}"></iframe>`;
    await navigator.clipboard.writeText(code);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2500);
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
              <h2 className="font-bold text-lg">Share Match</h2>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-white/60">{matchTitle}</p>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-4">
                <QRCode value={url} size={180} />
              </div>
            </div>

            <p className="text-center text-xs text-white/40">Scan to watch live scores</p>

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

            {/* Embed Code */}
            <div>
              <p className="text-xs text-white/40 mb-2">Embed in your website</p>
              <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <code className="flex-1 text-[10px] text-white/50 break-all leading-relaxed font-mono">
                  {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${shareToken}" width="320" height="120" frameborder="0" ...>`}
                </code>
                <button onClick={handleCopyEmbed} className="shrink-0 text-white/50 hover:text-white transition-colors mt-0.5">
                  {embedCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {embedCopied && <p className="text-xs text-green-400 mt-1">Embed code copied!</p>}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="h-10 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5 transition"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
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
                  href={`https://wa.me/?text=${encodeURIComponent(`Watch live score: ${matchTitle} — ${url}`)}`}
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
