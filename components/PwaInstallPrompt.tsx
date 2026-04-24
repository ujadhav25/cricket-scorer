'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed / running as PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Already installed, user dismissed, or no prompt available (and not iOS)
  if (isStandalone || dismissed) return null;
  if (!prompt && !isIos) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setDismissed(true);
    setPrompt(null);
  }

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80">
      <div className="rounded-2xl border border-cricket-green/30 bg-[#0d1a0d] shadow-2xl shadow-black/60 p-4">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          {/* App icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-96.png" alt="CricScorer" className="h-12 w-12 rounded-xl shrink-0" />

          <div className="min-w-0 flex-1 pr-4">
            <p className="font-bold text-sm text-white">Add CricScorer to Home Screen</p>
            <p className="text-xs text-white/50 mt-0.5">
              {isIos
                ? 'Tap the share button then "Add to Home Screen"'
                : 'Install for quick access and offline scoring'}
            </p>
          </div>
        </div>

        {/* iOS instructions */}
        {isIos && (
          <div className="mt-3 rounded-xl bg-white/5 px-3 py-2.5 text-xs text-white/60 space-y-1">
            <p>1. Tap <span className="text-white font-medium">Share</span> <span className="text-base">⎙</span> in Safari</p>
            <p>2. Scroll and tap <span className="text-white font-medium">"Add to Home Screen"</span></p>
            <p>3. Tap <span className="text-white font-medium">"Add"</span></p>
          </div>
        )}

        {/* Android install button */}
        {!isIos && prompt && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-cricket-green text-black font-bold text-sm py-2.5 hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
