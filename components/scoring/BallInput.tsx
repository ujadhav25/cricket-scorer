'use client';

import { cn } from '@/lib/utils';
import React from 'react';

interface BallInputProps {
  onBall: (event: BallEvent) => void;
  disabled?: boolean;
}

export interface BallEvent {
  runs: number;
  isWide?: boolean;
  isNoBall?: boolean;
  isLegBye?: boolean;
  isBye?: boolean;
  isWicket?: boolean;
}

type ExtraMode = 'wide' | 'noBall' | 'legBye' | 'bye' | null;

const EXTRA_RUN_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

const EXTRA_META: Record<NonNullable<ExtraMode>, { label: string; gradient: string; border: string; bg: string; note: string }> = {
  wide:   { label: 'Wide',    gradient: 'from-yellow-500 to-yellow-600', border: 'border-yellow-500/30', bg: 'bg-yellow-500/[0.06]', note: 'Select extra runs off the wide' },
  noBall: { label: 'No Ball', gradient: 'from-orange-500 to-orange-600', border: 'border-orange-500/30', bg: 'bg-orange-500/[0.06]', note: 'Select runs scored off the no ball' },
  legBye: { label: 'Leg Bye', gradient: 'from-purple-500 to-purple-600', border: 'border-purple-500/30', bg: 'bg-purple-500/[0.06]', note: 'Select leg bye runs' },
  bye:    { label: 'Bye',     gradient: 'from-indigo-500 to-indigo-600', border: 'border-indigo-500/30', bg: 'bg-indigo-500/[0.06]', note: 'Select bye runs' },
};

export function BallInput({ onBall, disabled }: BallInputProps) {
  const [extraMode, setExtraMode] = React.useState<ExtraMode>(null);

  function handleMain(runs: number) {
    onBall({ runs });
  }

  function handleExtraSelect(mode: ExtraMode) {
    if (mode === 'wide') {
      onBall({ runs: 0, isWide: true });
      return;
    }
    setExtraMode((prev) => (prev === mode ? null : mode));
  }

  function handleExtraRuns(runs: number) {
    if (!extraMode) return;
    const event: BallEvent = { runs };
    if (extraMode === 'wide')   event.isWide   = true;
    if (extraMode === 'noBall') event.isNoBall = true;
    if (extraMode === 'legBye') event.isLegBye = true;
    if (extraMode === 'bye')    event.isBye    = true;
    onBall(event);
    setExtraMode(null);
  }

  const meta = extraMode ? EXTRA_META[extraMode] : null;

  return (
    <div className="space-y-3">
      {/* Extra run picker */}
      {extraMode && meta && (
        <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-4 space-y-3 animate-scale-in`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{meta.label} — {meta.note}</p>
            <button
              onClick={() => setExtraMode(null)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              ✕ Cancel
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {EXTRA_RUN_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleExtraRuns(r)}
                disabled={disabled}
                className={cn(
                  'h-12 rounded-xl text-base font-bold text-white transition-all duration-200 active:scale-90 disabled:opacity-50',
                  `bg-gradient-to-b ${meta.gradient}`,
                  'shadow-md hover:shadow-lg hover:brightness-110'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main run buttons */}
      {!extraMode && (
        <>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {([0,1,2,3,4,6] as const).map((runs) => (
              <button
                key={runs}
                onClick={() => handleMain(runs)}
                disabled={disabled}
                className={cn(
                  'relative flex h-16 items-center justify-center rounded-2xl text-2xl font-black transition-all duration-200 active:scale-90 disabled:opacity-50',
                  runs === 4 ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30' :
                  runs === 6 ? 'bg-gradient-to-b from-cricket-green-500 to-cricket-green-600 text-white shadow-lg shadow-cricket-green-500/20 hover:shadow-xl hover:shadow-cricket-green-500/30' :
                  'bg-white/[0.04] border border-border/40 text-foreground hover:bg-white/[0.08] hover:border-border/60'
                )}
              >
                {runs}
              </button>
            ))}
          </div>

          {/* Wicket */}
          <button
            onClick={() => onBall({ runs: 0, isWicket: true })}
            disabled={disabled}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-xl font-black text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-red-500/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            W — Wicket
          </button>
        </>
      )}

      {/* Extras row */}
      <div className="grid grid-cols-4 gap-2">
        {([
          { key: 'wide'   as ExtraMode, label: 'Wd', gradient: 'from-yellow-500 to-yellow-600', shadow: 'shadow-yellow-500/20' },
          { key: 'noBall' as ExtraMode, label: 'Nb', gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
          { key: 'legBye' as ExtraMode, label: 'Lb', gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
          { key: 'bye'    as ExtraMode, label: 'B',  gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/20' },
        ]).map(({ key, label, gradient, shadow }) => (
          <button
            key={label}
            onClick={() => handleExtraSelect(key)}
            disabled={disabled}
            className={cn(
              'h-11 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-90 disabled:opacity-50',
              `bg-gradient-to-b ${gradient} shadow-md ${shadow}`,
              'hover:shadow-lg hover:brightness-110',
              extraMode === key ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-background scale-95' : ''
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

