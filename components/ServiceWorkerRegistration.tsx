'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegistration() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    const handleOffline = () => setOffline(true);
    const handleOnline = () => {
      setOffline(false);
      // Trigger background sync to flush queued balls
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

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white text-center text-xs font-bold py-1.5 px-4">
      ⚡ You&apos;re offline — balls are being queued and will sync when reconnected
    </div>
  );
}
