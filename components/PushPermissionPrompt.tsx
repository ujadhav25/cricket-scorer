'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const DISMISSED_KEY = 'push-prompt-dismissed';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Don't show if: push not supported, no VAPID key, already granted/denied, or user dismissed before
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Show after a 3s delay so it doesn't interrupt page load
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  async function enableNotifications() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        dismiss();
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const key = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
          auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
        }),
      });

      setDone(true);
      setTimeout(() => setShow(false), 2000);
    } catch {
      dismiss();
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 z-[9998] sm:bottom-6 sm:left-auto sm:right-6 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-white/10 bg-[#0d1a0d] shadow-2xl shadow-black/60 p-4">
        {!done ? (
          <>
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-4">
              <div className="h-10 w-10 rounded-xl bg-cricket-green/20 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-cricket-green" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Enable Notifications</p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                  Get alerts for wickets, sixes, fours, and milestones on live matches.
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={dismiss}
                className="h-9 rounded-xl border border-white/15 text-white text-xs font-semibold hover:bg-white/5 transition"
              >
                Not now
              </button>
              <button
                onClick={enableNotifications}
                disabled={loading}
                className="h-9 rounded-xl bg-cricket-green text-black text-xs font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                <Bell className="h-3.5 w-3.5" />
                {loading ? 'Enabling…' : 'Enable'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <div className="h-8 w-8 rounded-full bg-cricket-green/20 flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4 text-cricket-green" />
            </div>
            <p className="text-sm font-semibold text-cricket-green">Notifications enabled! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
