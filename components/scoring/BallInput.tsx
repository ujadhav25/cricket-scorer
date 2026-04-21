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

const EXTRA_META: Record<NonNullable<ExtraMode>, { label: string; color: string; note: string }> = {
  wide:   { label: 'Wide',    color: 'bg-yellow-600',  note: 'Select extra runs off the wide' },
  noBall: { label: 'No Ball', color: 'bg-orange-600',  note: 'Select runs scored off the no ball' },
  legBye: { label: 'Leg Bye', color: 'bg-purple-600',  note: 'Select leg bye runs' },
  bye:    { label: 'Bye',     color: 'bg-indigo-600',  note: 'Select bye runs' },
};

export function BallInput({ onBall, disabled }: BallInputProps) {
  const [extraMode, setExtraMode] = React.useState<ExtraMode>(null);

  function handleMain(runs: number) {
    onBall({ runs });
  }

  function handleExtraSelect(mode: ExtraMode) {
    if (mode === 'wide') {
      // Wide is always 1 run penalty, no extra runs off bat
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
      {/* Extra run picker — shown when an extra type is selected */}
      {extraMode && meta && (
        <div className={`rounded-xl border-2 p-3 space-y-2 ${
          extraMode === 'wide'   ? 'border-yellow-600/50 bg-yellow-950/20' :
          extraMode === 'noBall' ? 'border-orange-600/50 bg-orange-950/20' :
          extraMode === 'legBye' ? 'border-purple-600/50 bg-purple-950/20' :
                                   'border-indigo-600/50 bg-indigo-950/20'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{meta.label} — {meta.note}</p>
            <button
              onClick={() => setExtraMode(null)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded"
            >
              ✕ Cancel
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {EXTRA_RUN_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleExtraRuns(r)}
                disabled={disabled}
                className={cn(
                  'h-11 rounded-lg text-base font-bold transition-all active:scale-95 disabled:opacity-50',
                  meta.color, 'text-white hover:opacity-80'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main run buttons — hidden while picking extra runs */}
      {!extraMode && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {([0,1,2,3,4,6] as const).map((runs) => (
              <button
                key={runs}
                onClick={() => handleMain(runs)}
                disabled={disabled}
                className={cn(
                  'flex h-16 items-center justify-center rounded-xl text-2xl font-bold transition-all active:scale-95 disabled:opacity-50',
                  runs === 4 ? 'bg-blue-600 text-white hover:bg-blue-700' :
                  runs === 6 ? 'bg-green-600 text-white hover:bg-green-700' :
                  'bg-muted text-foreground hover:bg-muted/80'
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
            className="h-14 w-full rounded-xl bg-red-600 text-xl font-bold text-white transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
          >
            W — Wicket
          </button>
        </>
      )}

      {/* Extras row — always visible, highlights active */}
      <div className="grid grid-cols-4 gap-2">
        {([ 
          { key: 'wide'   as ExtraMode, label: 'Wd', className: 'bg-yellow-600 hover:bg-yellow-700' },
          { key: 'noBall' as ExtraMode, label: 'Nb', className: 'bg-orange-600 hover:bg-orange-700' },
          { key: 'legBye' as ExtraMode, label: 'Lb', className: 'bg-purple-600 hover:bg-purple-700' },
          { key: 'bye'    as ExtraMode, label: 'B',  className: 'bg-indigo-600 hover:bg-indigo-700' },
        ]).map(({ key, label, className }) => (
          <button
            key={label}
            onClick={() => handleExtraSelect(key)}
            disabled={disabled}
            className={cn(
              'h-11 rounded-lg text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50',
              className,
              extraMode === key ? 'ring-2 ring-white ring-offset-1 ring-offset-background scale-95' : ''
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

