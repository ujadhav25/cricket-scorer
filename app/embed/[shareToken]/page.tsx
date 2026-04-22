import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatOvers, legalBallCount } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Minimal inline styles for embed — no Tailwind classes needed (iframe context)
export default async function EmbedMatchPage({ params }: { params: { shareToken: string } }) {
  const match = await prisma.match.findUnique({
    where: { shareToken: params.shareToken },
    include: {
      teamA: true,
      teamB: true,
      innings: {
        include: {
          battingTeam: true,
          deliveries: { select: { isWide: true, isNoBall: true, overNumber: true, ballNumber: true, runs: true, isWicket: true } },
        },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });

  if (!match) notFound();

  const inn1 = match.innings.find((i) => i.inningsNumber === 1);
  const inn2 = match.innings.find((i) => i.inningsNumber === 2);
  const current = match.innings.find((i) => !i.isCompleted) ?? match.innings[match.innings.length - 1];
  const legalBalls = current ? legalBallCount(current.deliveries) : 0;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{match.teamA.name} vs {match.teamB.name} — CricScorer</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; }
          .wrap { padding: 12px 16px; }
          .title { font-size: 13px; color: #8b949e; margin-bottom: 8px; }
          .teams { display: flex; gap: 16px; justify-content: space-between; }
          .team { flex: 1; }
          .team-name { font-size: 12px; color: #8b949e; margin-bottom: 2px; }
          .score { font-size: 24px; font-weight: 900; }
          .overs { font-size: 11px; color: #8b949e; margin-top: 2px; }
          .status { display: inline-block; font-size: 10px; font-weight: 700; border-radius: 999px; padding: 2px 8px; margin-top: 8px; }
          .live { background: #b91c1c; color: #fff; animation: pulse 1.5s infinite; }
          .completed { background: #166534; color: #fff; }
          .footer { margin-top: 8px; font-size: 10px; color: #484f58; text-align: right; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <div className="title">{match.teamA.name} vs {match.teamB.name}</div>
          <div className="teams">
            <div className="team">
              <div className="team-name">{match.teamA.name}</div>
              <div className="score">
                {inn1?.battingTeamId === match.teamAId
                  ? `${inn1.totalRuns}/${inn1.totalWickets}`
                  : inn2?.battingTeamId === match.teamAId
                  ? `${inn2?.totalRuns ?? 0}/${inn2?.totalWickets ?? 0}`
                  : '—'}
              </div>
              {current?.battingTeamId === match.teamAId && (
                <div className="overs">({formatOvers(legalBalls)} ov)</div>
              )}
            </div>
            <div className="team" style={{ textAlign: 'right' }}>
              <div className="team-name">{match.teamB.name}</div>
              <div className="score">
                {inn1?.battingTeamId === match.teamBId
                  ? `${inn1.totalRuns}/${inn1.totalWickets}`
                  : inn2?.battingTeamId === match.teamBId
                  ? `${inn2?.totalRuns ?? 0}/${inn2?.totalWickets ?? 0}`
                  : '—'}
              </div>
              {current?.battingTeamId === match.teamBId && (
                <div className="overs">({formatOvers(legalBalls)} ov)</div>
              )}
            </div>
          </div>
          <div>
            <span className={`status ${match.status === 'LIVE' ? 'live' : match.status === 'COMPLETED' ? 'completed' : ''}`}>
              {match.status}
            </span>
          </div>
          <div className="footer">via CricScorer</div>
        </div>
      </body>
    </html>
  );
}
