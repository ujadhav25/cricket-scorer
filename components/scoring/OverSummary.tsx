'use client';

import { cn } from '@/lib/utils';

interface BallDotProps {
  runs: number;
  isWide: boolean;
  isNoBall: boolean;
  isWicket: boolean;
}

function BallDot({ runs, isWide, isNoBall, isWicket }: BallDotProps) {
  let label = runs === 0 ? '•' : String(runs);
  if (isWide) label = 'Wd';
  if (isNoBall) label = runs > 0 ? `Nb+${runs}` : 'Nb';
  if (isWicket) label = 'W';

  return (
    <div
      className={cn(
        'flex h-8 min-w-8 px-1.5 items-center justify-center rounded-full text-xs font-bold',
        isWicket && 'bg-red-600 text-white',
        runs === 4 && !isWicket && 'bg-blue-600 text-white',
        runs === 6 && !isWicket && 'bg-green-600 text-white',
        (isWide || isNoBall) && 'bg-yellow-600 text-white',
        runs > 0 && runs < 4 && !isWicket && !isWide && !isNoBall && 'bg-white text-black',
        runs === 0 && !isWicket && !isWide && !isNoBall && 'bg-muted text-muted-foreground'
      )}
    >
      {label}
    </div>
  );
}

interface OverSummaryProps {
  deliveries: Array<{
    runs: number;
    isWide: boolean;
    isNoBall: boolean;
    isWicket: boolean;
    overNumber: number;
    ballNumber: number;
  }>;
  currentOver: number;
}

export function OverSummary({ deliveries, currentOver }: OverSummaryProps) {
  const overDeliveries = deliveries.filter((d) => d.overNumber === currentOver);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Over {currentOver + 1}</p>
      <div className="flex gap-2">
        {overDeliveries.length === 0 ? (
          <span className="text-xs text-muted-foreground">No balls bowled yet</span>
        ) : (
          overDeliveries.map((d, i) => (
            <BallDot
              key={i}
              runs={d.runs}
              isWide={d.isWide}
              isNoBall={d.isNoBall}
              isWicket={d.isWicket}
            />
          ))
        )}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 6 - overDeliveries.filter(d => !d.isWide && !d.isNoBall).length) }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 w-8 rounded-full border border-dashed border-border" />
        ))}
      </div>
    </div>
  );
}
