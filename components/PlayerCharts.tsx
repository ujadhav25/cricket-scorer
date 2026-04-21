'use client';

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface BatInnings {
  matchLabel: string;
  runs: number;
  balls: number;
  sr: number;
}

interface BowlInnings {
  matchLabel: string;
  wickets: number;
  runs: number;
  econ: number;
}

export function BattingChart({ data }: { data: BatInnings[] }) {
  if (data.length < 2) return null;
  return (
    <div className="space-y-5 mt-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Runs per Innings</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="runsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="matchLabel" tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#888' }} />
            <Tooltip
              contentStyle={{ background: '#0d1a0d', border: '1px solid #16a34a33', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#aaa' }}
              itemStyle={{ color: '#16a34a' }}
            />
            <Area type="monotone" dataKey="runs" stroke="#16a34a" strokeWidth={2} fill="url(#runsGrad)" dot={{ r: 3, fill: '#16a34a' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Strike Rate per Innings</p>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="matchLabel" tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#888' }} />
            <Tooltip
              contentStyle={{ background: '#0d1a0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#aaa' }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <Line type="monotone" dataKey="sr" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: '#60a5fa' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BowlingChart({ data }: { data: BowlInnings[] }) {
  if (data.length < 2) return null;
  return (
    <div className="space-y-5 mt-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Wickets per Innings</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="matchLabel" tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#888' }} />
            <Tooltip
              contentStyle={{ background: '#0d1a0d', border: '1px solid #16a34a33', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#aaa' }}
              itemStyle={{ color: '#16a34a' }}
            />
            <Bar dataKey="wickets" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Economy per Innings</p>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="matchLabel" tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#888' }} />
            <Tooltip
              contentStyle={{ background: '#0d1a0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#aaa' }}
              itemStyle={{ color: '#f97316' }}
            />
            <Line type="monotone" dataKey="econ" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
