'use client';

import { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';

export interface BattingStatRow {
  id: string;
  name: string;
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  hs: number;
  notOuts: number;
  hundreds: number;
  fifties: number;
  nineties: number;
  avg: string;
  sr: string;
}

export interface BowlingStatRow {
  id: string;
  name: string;
  matches: number;
  legalBalls: number;
  runs: number;
  wickets: number;
  maidens: number;
  overs: string;
  econ: string;
  avg: string;
  sr: string;
  bestFigures: string;
  bestWickets: number;
  bestRuns: number;
  fiveWickets: number;
}

type ColDef = {
  key: string;
  label: string;
  value: (r: BattingStatRow | BowlingStatRow) => string | number;
  highlight?: boolean;
};

const BATTING_CATS = [
  { id: 'most-runs' as const, label: 'Most Runs' },
  { id: 'highest-scores' as const, label: 'Highest Scores' },
  { id: 'best-bat-avg' as const, label: 'Best Batting Average' },
  { id: 'best-bat-sr' as const, label: 'Best Batting Strike Rate' },
  { id: 'most-hundreds' as const, label: 'Most Hundreds' },
  { id: 'most-fifties' as const, label: 'Most Fifties' },
  { id: 'most-fours' as const, label: 'Most Fours' },
  { id: 'most-sixes' as const, label: 'Most Sixes' },
  { id: 'most-nineties' as const, label: 'Most Nineties' },
];

const BOWLING_CATS = [
  { id: 'most-wickets' as const, label: 'Most Wickets' },
  { id: 'best-bowl-avg' as const, label: 'Best Bowling Average' },
  { id: 'best-bowling' as const, label: 'Best Bowling' },
  { id: 'most-5w' as const, label: 'Most 5 Wickets Haul' },
  { id: 'best-economy' as const, label: 'Best Economy' },
  { id: 'best-bowl-sr' as const, label: 'Best Bowling Strike Rate' },
];

type CategoryId =
  | 'most-runs' | 'highest-scores' | 'best-bat-avg' | 'best-bat-sr'
  | 'most-hundreds' | 'most-fifties' | 'most-fours' | 'most-sixes' | 'most-nineties'
  | 'most-wickets' | 'best-bowl-avg' | 'best-bowling' | 'most-5w' | 'best-economy' | 'best-bowl-sr';

function getTableConfig(
  cat: CategoryId,
  batting: BattingStatRow[],
  bowling: BowlingStatRow[],
): { rows: (BattingStatRow | BowlingStatRow)[]; cols: ColDef[] } {
  const b = (key: string, label: string, getValue: (r: BattingStatRow) => string | number, highlight?: boolean): ColDef => ({
    key, label, value: (r) => getValue(r as BattingStatRow), highlight,
  });
  const w = (key: string, label: string, getValue: (r: BowlingStatRow) => string | number, highlight?: boolean): ColDef => ({
    key, label, value: (r) => getValue(r as BowlingStatRow), highlight,
  });
  const nameCol: ColDef = { key: 'name', label: 'Player', value: (r) => r.name };

  switch (cat) {
    case 'most-runs':
      return {
        rows: [...batting].sort((a, b) => b.runs - a.runs),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('no','NO',r=>r.notOuts), b('runs','Runs',r=>r.runs,true), b('hs','HS',r=>r.hs), b('avg','Avg',r=>r.avg), b('sr','SR',r=>r.sr), b('4s','4s',r=>r.fours), b('6s','6s',r=>r.sixes)],
      };
    case 'highest-scores':
      return {
        rows: [...batting].sort((a, b) => b.hs - a.hs),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('hs','HS',r=>r.hs,true), b('runs','Runs',r=>r.runs), b('avg','Avg',r=>r.avg), b('sr','SR',r=>r.sr)],
      };
    case 'best-bat-avg':
      return {
        rows: [...batting].filter(r => r.innings - r.notOuts > 0).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg)),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('no','NO',r=>r.notOuts), b('runs','Runs',r=>r.runs), b('avg','Avg',r=>r.avg,true), b('sr','SR',r=>r.sr)],
      };
    case 'best-bat-sr':
      return {
        rows: [...batting].filter(r => r.balls >= 10).sort((a, b) => parseFloat(b.sr) - parseFloat(a.sr)),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('runs','Runs',r=>r.runs), b('balls','Balls',r=>r.balls), b('sr','SR',r=>r.sr,true), b('avg','Avg',r=>r.avg)],
      };
    case 'most-hundreds':
      return {
        rows: [...batting].sort((a, b) => b.hundreds - a.hundreds || b.runs - a.runs),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('100s','100s',r=>r.hundreds,true), b('50s','50s',r=>r.fifties), b('runs','Runs',r=>r.runs), b('avg','Avg',r=>r.avg)],
      };
    case 'most-fifties':
      return {
        rows: [...batting].sort((a, b) => b.fifties - a.fifties || b.runs - a.runs),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('50s','50s',r=>r.fifties,true), b('100s','100s',r=>r.hundreds), b('runs','Runs',r=>r.runs), b('avg','Avg',r=>r.avg)],
      };
    case 'most-fours':
      return {
        rows: [...batting].sort((a, b) => b.fours - a.fours),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('4s','4s',r=>r.fours,true), b('6s','6s',r=>r.sixes), b('runs','Runs',r=>r.runs), b('sr','SR',r=>r.sr)],
      };
    case 'most-sixes':
      return {
        rows: [...batting].sort((a, b) => b.sixes - a.sixes),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('6s','6s',r=>r.sixes,true), b('4s','4s',r=>r.fours), b('runs','Runs',r=>r.runs), b('sr','SR',r=>r.sr)],
      };
    case 'most-nineties':
      return {
        rows: [...batting].sort((a, b) => b.nineties - a.nineties || b.runs - a.runs),
        cols: [nameCol, b('m','M',r=>r.matches), b('inn','Inn',r=>r.innings), b('90s','90s',r=>r.nineties,true), b('runs','Runs',r=>r.runs), b('hs','HS',r=>r.hs), b('avg','Avg',r=>r.avg)],
      };
    case 'most-wickets':
      return {
        rows: [...bowling].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs),
        cols: [nameCol, w('m','M',r=>r.matches), w('o','O',r=>r.overs), w('r','R',r=>r.runs), w('w','W',r=>r.wickets,true), w('avg','Avg',r=>r.avg), w('econ','Econ',r=>r.econ), w('sr','SR',r=>r.sr)],
      };
    case 'best-bowl-avg':
      return {
        rows: [...bowling].filter(r => r.wickets > 0).sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg)),
        cols: [nameCol, w('m','M',r=>r.matches), w('o','O',r=>r.overs), w('w','W',r=>r.wickets), w('avg','Avg',r=>r.avg,true), w('econ','Econ',r=>r.econ), w('sr','SR',r=>r.sr)],
      };
    case 'best-bowling':
      return {
        rows: [...bowling].filter(r => r.bestWickets > 0).sort((a, b) => b.bestWickets - a.bestWickets || a.bestRuns - b.bestRuns),
        cols: [nameCol, w('m','M',r=>r.matches), w('best','Best',r=>r.bestFigures,true), w('w','W',r=>r.wickets), w('avg','Avg',r=>r.avg), w('econ','Econ',r=>r.econ)],
      };
    case 'most-5w':
      return {
        rows: [...bowling].sort((a, b) => b.fiveWickets - a.fiveWickets || b.wickets - a.wickets),
        cols: [nameCol, w('m','M',r=>r.matches), w('5w','5W',r=>r.fiveWickets,true), w('w','W',r=>r.wickets), w('best','Best',r=>r.bestFigures), w('avg','Avg',r=>r.avg)],
      };
    case 'best-economy':
      return {
        rows: [...bowling].filter(r => r.legalBalls >= 6).sort((a, b) => parseFloat(a.econ) - parseFloat(b.econ)),
        cols: [nameCol, w('m','M',r=>r.matches), w('o','O',r=>r.overs), w('r','R',r=>r.runs), w('w','W',r=>r.wickets), w('econ','Econ',r=>r.econ,true), w('avg','Avg',r=>r.avg)],
      };
    case 'best-bowl-sr':
      return {
        rows: [...bowling].filter(r => r.wickets > 0).sort((a, b) => parseFloat(a.sr) - parseFloat(b.sr)),
        cols: [nameCol, w('m','M',r=>r.matches), w('o','O',r=>r.overs), w('w','W',r=>r.wickets), w('sr','SR',r=>r.sr,true), w('avg','Avg',r=>r.avg), w('econ','Econ',r=>r.econ)],
      };
  }
}

export default function TournamentStatsClient({
  batting,
  bowling,
}: {
  batting: BattingStatRow[];
  bowling: BowlingStatRow[];
}) {
  const [active, setActive] = useState<CategoryId>('most-runs');
  const { rows, cols } = useMemo(() => getTableConfig(active, batting, bowling), [active, batting, bowling]);

  if (batting.length === 0 && bowling.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No stats yet — complete some matches first</p>;
  }

  return (
    <div className="mt-4">
      {/* Mobile: scrollable pill buttons */}
      <div className="md:hidden space-y-3 mb-4">
        {[{ label: 'Batting', cats: BATTING_CATS }, { label: 'Bowling', cats: BOWLING_CATS }].map(({ label, cats }) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap">
              {cats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActive(cat.id)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                    active === cat.id
                      ? 'bg-cricket-green text-white border-cricket-green font-semibold'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col w-52 shrink-0 gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 pb-1">Batting</p>
          {BATTING_CATS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                active === cat.id ? 'bg-cricket-green text-white font-semibold' : 'hover:bg-muted'
              }`}
            >
              <span>{cat.label}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>
          ))}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 pb-1 pt-4">Bowling</p>
          {BOWLING_CATS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                active === cat.id ? 'bg-cricket-green text-white font-semibold' : 'hover:bg-muted'
              }`}
            >
              <span>{cat.label}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data for this category yet</p>
          ) : (
            <table className="w-full text-sm" style={{ minWidth: '380px' }}>
              <thead>
                <tr className="border-b border-border text-xs">
                  {cols.map((col, i) => (
                    <th
                      key={col.key}
                      className={`pb-2 font-medium ${i === 0 ? 'text-left pr-4' : 'text-right pr-3'} ${
                        col.highlight ? 'text-foreground font-bold' : 'text-muted-foreground'
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.id} className={`border-b border-border/50 ${ri === 0 ? 'bg-cricket-green/5' : ''}`}>
                    {cols.map((col, i) => (
                      <td
                        key={col.key}
                        className={`py-2.5 ${i === 0 ? 'text-left pr-4 font-medium' : 'text-right pr-3'} ${
                          col.highlight ? 'font-black text-cricket-green' : ''
                        }`}
                      >
                        {col.value(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
