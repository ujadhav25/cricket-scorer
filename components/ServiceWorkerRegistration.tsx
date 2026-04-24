'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function ServiceWorkerRegistration() {
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Already waiting (user opened page after update was downloaded)
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateReady(true);
      }

      // New update found while page is open
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateReady(true);
          }
        });
      });
    }).catch(console.error);

    // Listen for the SW telling us it's activated (after skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    const handleOffline = () => setOffline(true);
    const handleOnline = () => {
      setOffline(false);
      navigator.serviceWorker?.ready.then((reg) => {
        if ('sync' in reg) {
          (reg as any).sync.register('flush-ball-queue').catch(() => {});
        }
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  function applyUpdate() {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }

  return (
    <>
      {/* Offline banner */}
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white text-center text-xs font-bold py-1.5 px-4">
          ⚡ You&apos;re offline — balls are being queued and will sync when reconnected
        </div>
      )}

      {/* Update available toast */}
      {updateReady && (
        <div className="fixed bottom-24 left-3 right-3 z-[9999] sm:bottom-6 sm:left-auto sm:right-6 sm:w-80">
          <div className="rounded-2xl border border-cricket-green/40 bg-[#0d1a0d] shadow-2xl shadow-black/60 p-4">
            <button
              onClick={() => setUpdateReady(false)}
              className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3 pr-4">
              <div className="h-9 w-9 rounded-xl bg-cricket-green/20 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-cricket-green" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Update Available</p>
                <p className="text-xs text-white/50 mt-0.5">A new version of CricScorer is ready.</p>
              </div>
            </div>
            <button
              onClick={applyUpdate}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-cricket-green text-black font-bold text-sm py-2.5 hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh &amp; Update
            </button>
          </div>
        </div>
      )}
    </>
  );
}
