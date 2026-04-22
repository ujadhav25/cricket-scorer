'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

interface InningsData {
  inningsNumber: number;
  teamName: string;
  totalRuns: number;
  deliveries: { overNumber: number; runs: number; isWide: boolean; isNoBall: boolean }[];
}

interface MatchChartsProps {
  innings: InningsData[];
}

const COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b'];

function buildOverData(deliveries: InningsData['deliveries'], totalOvers?: number) {
  const overMap: Record<number, number> = {};
  for (const d of deliveries) {
    overMap[d.overNumber] = (overMap[d.overNumber] ?? 0) + d.runs + (d.isWide || d.isNoBall ? 1 : 0);
  }
  const maxOver = deliveries.length > 0 ? Math.max(...deliveries.map((d) => d.overNumber)) : 0;
  const result: { over: number; runs: number }[] = [];
  for (let i = 0; i <= maxOver; i++) {
    result.push({ over: i + 1, runs: overMap[i] ?? 0 });
  }
  return result;
}

function buildWormData(inn1: InningsData, inn2?: InningsData) {
  const over1 = buildOverData(inn1.deliveries);
  const over2 = inn2 ? buildOverData(inn2.deliveries) : [];
  const maxLen = Math.max(over1.length, over2.length);
  const data: { over: number; [key: string]: number }[] = [];
  let cum1 = 0, cum2 = 0;
  for (let i = 0; i < maxLen; i++) {
    cum1 += over1[i]?.runs ?? 0;
    cum2 += over2[i]?.runs ?? 0;
    const point: { over: number; [key: string]: number } = { over: i + 1 };
    point[inn1.teamName] = cum1;
    if (inn2) point[inn2.teamName] = cum2;
    data.push(point);
  }
  return data;
}

function buildManhattanData(inn1: InningsData, inn2?: InningsData) {
  const over1 = buildOverData(inn1.deliveries);
  const over2 = inn2 ? buildOverData(inn2.deliveries) : [];
  const maxLen = Math.max(over1.length, over2.length);
  return Array.from({ length: maxLen }, (_, i) => ({
    over: i + 1,
    [inn1.teamName]: over1[i]?.runs ?? 0,
    ...(inn2 ? { [inn2.teamName]: over2[i]?.runs ?? 0 } : {}),
  }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="text-muted-foreground text-xs mb-1">Over {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function MatchCharts({ innings }: MatchChartsProps) {
  const [activeChart, setActiveChart] = useState<'worm' | 'manhattan'>('worm');

  const inn1 = innings.find((i) => i.inningsNumber === 1);
  const inn2 = innings.find((i) => i.inningsNumber === 2);

  if (!inn1 || inn1.deliveries.length === 0) return null;

  const wormData = buildWormData(inn1, inn2);
  const manhattanData = buildManhattanData(inn1, inn2);

  const teams = [inn1.teamName, ...(inn2 ? [inn2.teamName] : [])];

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Match Analysis</h3>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setActiveChart('worm')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${activeChart === 'worm' ? 'bg-cricket-green text-white' : 'text-muted-foreground hover:bg-white/[0.05]'}`}
            >
              Worm
            </button>
            <button
              onClick={() => setActiveChart('manhattan')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${activeChart === 'manhattan' ? 'bg-cricket-green text-white' : 'text-muted-foreground hover:bg-white/[0.05]'}`}
            >
              Manhattan
            </button>
          </div>
        </div>

        {activeChart === 'worm' && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Cumulative runs progression over overs</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={wormData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  {teams.map((t, i) => (
                    <linearGradient key={t} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="over" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {teams.map((t, i) => (
                  <Area
                    key={t}
                    type="monotone"
                    dataKey={t}
                    stroke={COLORS[i]}
                    strokeWidth={2}
                    fill={`url(#grad${i})`}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeChart === 'manhattan' && (
          <div>
            <p className="text-xs text-muted-foreground mb-3">Runs scored per over</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={manhattanData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="over" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {teams.map((t, i) => (
                  <Bar key={t} dataKey={t} fill={COLORS[i]} radius={[3, 3, 0, 0]} maxBarSize={24} opacity={0.85} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}
