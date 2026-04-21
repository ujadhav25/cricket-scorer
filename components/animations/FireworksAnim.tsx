'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  radius: number;
  gravity: number;
}

const COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff6bcd', '#ff9f43', '#54a0ff', '#fff',
  '#ff4757', '#2ed573', '#eccc68', '#a29bfe',
];

export function FireworksAnim({ winnerName, matchId }: { winnerName?: string; matchId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const storageKey = `fireworks-seen-${matchId}`;
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(storageKey);
  });

  function dismiss() {
    sessionStorage.setItem(storageKey, '1');
    setVisible(false);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];

    function explode(x: number, y: number, color: string) {
      const count = 90 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
        const speed = Math.random() * 6 + 2;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          alpha: 1,
          color: Math.random() < 0.15 ? '#fff' : color,
          radius: Math.random() * 3 + 1,
          gravity: 0.08 + Math.random() * 0.04,
        });
      }
    }

    function launch() {
      const x = canvas!.width * (0.15 + Math.random() * 0.7);
      const y = canvas!.height * (0.1 + Math.random() * 0.35);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      explode(x, y, color);
    }

    // Initial burst
    for (let i = 0; i < 5; i++) setTimeout(launch, i * 200);

    const interval = setInterval(launch, 500);

    let start = 0;
    const DURATION = 5500;

    function draw(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.97;
        p.alpha -= 0.012;

        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (elapsed < DURATION || particles.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        dismiss();
      }
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
      {winnerName && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center gap-5">
          <div
            className="rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 px-10 py-6 text-center shadow-2xl"
            style={{ animation: 'pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            <div className="text-4xl font-black text-black drop-shadow">🏆 {winnerName}</div>
            <div className="mt-1 text-xl font-bold text-black/80">wins the match!</div>
          </div>
          <button
            className="pointer-events-auto rounded-xl bg-white/10 border border-white/20 backdrop-blur px-6 py-2.5 text-white font-semibold text-sm hover:bg-white/20 transition"
            onClick={dismiss}
          >
            ← View Match Details
          </button>
          <style>{`
            @keyframes pop {
              0% { transform: scale(0.4); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
