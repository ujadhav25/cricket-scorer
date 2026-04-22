import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(req: Request, { params }: { params: { shareToken: string } }) {
  const match = await prisma.match.findUnique({
    where: { shareToken: params.shareToken },
    include: {
      teamA: true,
      teamB: true,
      innings: {
        select: { inningsNumber: true, battingTeamId: true, totalRuns: true, totalWickets: true, totalOvers: true },
        orderBy: { inningsNumber: 'asc' },
      },
    },
  });

  if (!match) {
    return new Response('Not found', { status: 404 });
  }

  const inn1 = match.innings.find((i) => i.inningsNumber === 1);
  const inn2 = match.innings.find((i) => i.inningsNumber === 2);

  const teamAScore = inn1?.battingTeamId === match.teamAId
    ? `${inn1.totalRuns}/${inn1.totalWickets}`
    : inn2?.battingTeamId === match.teamAId
    ? `${inn2?.totalRuns ?? 0}/${inn2?.totalWickets ?? 0}`
    : 'Yet to bat';

  const teamBScore = inn1?.battingTeamId === match.teamBId
    ? `${inn1.totalRuns}/${inn1.totalWickets}`
    : inn2?.battingTeamId === match.teamBId
    ? `${inn2?.totalRuns ?? 0}/${inn2?.totalWickets ?? 0}`
    : 'Yet to bat';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a1628 0%, #0d2010 100%)',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Background accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>🏏</div>
            <span style={{ color: '#22c55e', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>CricScorer</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: match.status === 'LIVE' ? '#991b1b' : '#166534',
            borderRadius: '999px', padding: '6px 20px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>{match.status}</span>
          </div>
        </div>

        {/* Teams + Scores */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
          {/* Team A */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ color: '#9ca3af', fontSize: '20px', marginBottom: '8px' }}>{match.teamA.name}</span>
            <span style={{ color: '#ffffff', fontSize: '80px', fontWeight: 900, lineHeight: 1 }}>{teamAScore}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#4b5563', fontSize: '28px', fontWeight: 700 }}>VS</span>
          </div>

          {/* Team B */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: '#9ca3af', fontSize: '20px', marginBottom: '8px' }}>{match.teamB.name}</span>
            <span style={{ color: '#ffffff', fontSize: '80px', fontWeight: 900, lineHeight: 1 }}>{teamBScore}</span>
          </div>
        </div>

        {/* Footer */}
        {match.venue && (
          <div style={{ marginTop: '30px', color: '#6b7280', fontSize: '18px' }}>📍 {match.venue}</div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
