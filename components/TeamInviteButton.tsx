'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { UserPlus, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeamInviteButtonProps {
  joinToken: string;
  teamName: string;
}

export function TeamInviteButton({ joinToken, teamName }: TeamInviteButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}/join/team/${joinToken}`);
  }, [joinToken]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers that block clipboard API
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: `Join ${teamName}`, text: `You've been invited to join ${teamName}`, url });
    } catch (err: any) {
      // AbortError = user cancelled — not an error worth reporting
      if (err?.name !== 'AbortError') {
        handleCopy();
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-xl"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4" /> Invite
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1a0d] p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-white">Invite Players</h2>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* QR + info side by side */}
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white p-2.5 shrink-0">
                <QRCode value={url || 'https://cricscorer.app'} size={100} />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm text-white/60 leading-snug">
                  Invite players to join <span className="text-white font-semibold">{teamName}</span>
                </p>
                <p className="text-xs text-white/30">Scan the QR code or share the link below</p>
              </div>
            </div>

            {/* Link row */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="flex-1 text-xs text-white/60 truncate">{url}</p>
              <button onClick={handleCopy} className="shrink-0 text-white/50 hover:text-white transition-colors">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {copied && <p className="text-center text-xs text-green-400 -mt-1">Link copied!</p>}

            {/* Action buttons */}
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
                  href={`https://wa.me/?text=${encodeURIComponent(`Join ${teamName}: ${url}`)}`}
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
