'use client';

import { LOCALES, type Locale } from '@/lib/i18n';
import { useLocale } from '@/components/LocaleProvider';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export function LanguagePicker({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const current = LOCALES.find((l) => l.code === locale)!;

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!btnRef.current?.contains(target) && !dropdownRef.current?.contains(target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
        minWidth: 180,
        zIndex: 9999,
      });
    }
    setOpen((o) => !o);
  }

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-xl"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onMouseDown={(e) => { e.preventDefault(); setLocale(l.code as Locale); setOpen(false); }}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent/10',
                locale === l.code ? 'bg-cricket-green/10 text-cricket-green font-semibold' : 'text-foreground'
              )}
            >
              <span>{l.nativeLabel}</span>
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={cn('relative', className)}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
        aria-label="Change language"
      >
        <Languages className="h-3.5 w-3.5" />
        <span>{current.nativeLabel}</span>
      </button>
      {dropdown}
    </div>
  );
}
