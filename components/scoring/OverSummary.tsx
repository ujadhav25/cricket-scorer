'use client';

import { cn } from '@/lib/utils';
import { useLocale } from '@/components/LocaleProvider';

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
        'flex h-9 min-w-9 px-1.5 items-center justify-center rounded-xl text-xs font-bold transition-all duration-200',
        isWicket && 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md shadow-red-500/20',
        runs === 4 && !isWicket && 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20',
        runs === 6 && !isWicket && 'bg-gradient-to-b from-cricket-green-500 to-cricket-green-600 text-white shadow-md shadow-cricket-green-500/20',
        (isWide || isNoBall) && !isWicket && 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-white shadow-md shadow-yellow-500/20',
        runs > 0 && runs < 4 && !isWicket && !isWide && !isNoBall && 'bg-white/10 border border-white/20 text-foreground',
        runs === 0 && !isWicket && !isWide && !isNoBall && 'bg-white/[0.04] border border-border/30 text-muted-foreground'
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
  const { t } = useLocale();

  return (
    <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-4">
      <p className="mb-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('match.overs')} {currentOver + 1}</p>
      <div className="flex gap-2">
        {overDeliveries.length === 0 ? (
          <span className="text-xs text-muted-foreground/60">{t('scoring.noBallsBowled')}</span>
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
        {Array.from({ length: Math.max(0, 6 - overDeliveries.filter(d => !d.isWide && !d.isNoBall).length) }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9 w-9 rounded-xl border border-dashed border-border/20" />
        ))}
      </div>
    </div>
  );
}
