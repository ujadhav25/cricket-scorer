import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CricScorer — Real-time Cricket Scoring';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #0f2a1a 50%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background glow blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22,163,74,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Grid lines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(22,163,74,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(22,163,74,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Icon + name row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                boxShadow: '0 0 40px rgba(22,163,74,0.5)',
              }}
            >
              🏏
            </div>
            <span
              style={{
                fontSize: '64px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-2px',
              }}
            >
              CricScorer
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              maxWidth: '700px',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Real-time cricket scoring, tournaments &amp; player stats
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            {['⚡ Live Scoring', '🏆 Tournaments', '📊 Stats', '🔗 Share'].map((feat) => (
              <div
                key={feat}
                style={{
                  padding: '10px 22px',
                  borderRadius: '100px',
                  background: 'rgba(22,163,74,0.15)',
                  border: '1px solid rgba(22,163,74,0.35)',
                  color: '#4ade80',
                  fontSize: '18px',
                  fontWeight: 600,
                  display: 'flex',
                }}
              >
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom URL strip */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '18px',
          }}
        >
          cricscorer.app
        </div>
      </div>
    ),
    { ...size }
  );
}
