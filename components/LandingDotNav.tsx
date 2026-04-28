'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'hero',        label: 'Home' },
  { id: 'scoring',     label: 'Live Scoring' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'analytics',   label: 'Analytics' },
  { id: 'share',       label: 'Share & Spectate' },
  { id: 'teams',       label: 'Teams & Players' },
  { id: 'pwa',         label: 'Mobile App' },
  { id: 'cta',         label: 'Get Started' },
];

export function LandingDotNav() {
  const [active, setActive] = useState('hero');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // pick the entry that is most visible
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.intersectionRatio) {
              best = entry;
            }
          }
        }
        if (best) setActive(best.target.id);
      },
      { threshold: [0.3, 0.5], rootMargin: '0px 0px -20% 0px' }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // show nav after a small scroll
    const onScroll = () => setVisible(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className={`fixed left-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-3 transition-all duration-500 lg:flex
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
      aria-label="Page sections"
    >
      {SECTIONS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            title={label}
            aria-label={`Jump to ${label}`}
            className="group relative flex items-center"
          >
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-6 whitespace-nowrap rounded-lg border border-border/40 bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1">
              {label}
            </span>

            {/* Dot */}
            <span
              className={`block rounded-full transition-all duration-300
                ${isActive
                  ? 'h-3 w-3 bg-cricket-green shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]'
                  : 'h-2 w-2 bg-border/60 hover:bg-muted-foreground/60'
                }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
