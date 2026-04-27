import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const team = await prisma.team.findUnique({
    where: { joinToken: params.token },
    select: {
      name: true,
      color: true,
      homeGround: true,
      _count: { select: { players: true } },
    },
  });

  if (!team) return new Response('Not found', { status: 404 });

  const initial = team.name.charAt(0).toUpperCase();
  const playerCount = team._count.players;

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
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: `linear-gradient(90deg, ${team.color}, ${team.color}99)`,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '60px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>🏏</div>
            <span
              style={{
                color: '#22c55e',
                fontSize: '24px',
                fontWeight: 900,
                letterSpacing: '-0.5px',
              }}
            >
              CricScorer
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '999px',
              padding: '8px 20px',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span style={{ color: '#9ca3af', fontSize: '16px' }}>Team Invite</span>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '60px',
            flex: 1,
          }}
        >
          {/* Team badge */}
          <div
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '36px',
              background: team.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '90px',
              fontWeight: 900,
              color: '#fff',
              flexShrink: 0,
              boxShadow: `0 0 80px ${team.color}55`,
            }}
          >
            {initial}
          </div>

          {/* Team info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                color: '#ffffff',
                fontSize: '72px',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-2px',
              }}
            >
              {team.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '8px 18px',
                }}
              >
                <span style={{ color: '#9ca3af', fontSize: '18px' }}>
                  👥 {playerCount} {playerCount === 1 ? 'player' : 'players'}
                </span>
              </div>

              {team.homeGround && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '8px 18px',
                  }}
                >
                  <span style={{ color: '#9ca3af', fontSize: '18px' }}>
                    📍 {team.homeGround}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                color: team.color,
                fontSize: '24px',
                fontWeight: 600,
                marginTop: '8px',
              }}
            >
              You've been invited to join the team →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
