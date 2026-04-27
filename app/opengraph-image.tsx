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
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(22,163,74,0.18)',
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
            background: 'rgba(22,163,74,0.10)',
            display: 'flex',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '22px',
                background: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 48px rgba(22,163,74,0.55)',
              }}
            >
              <span style={{ fontSize: '38px', fontWeight: 900, color: '#ffffff', letterSpacing: '-1px' }}>
                CS
              </span>
            </div>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-2px',
              }}
            >
              CricScorer
            </span>
          </div>
          <p
            style={{
              fontSize: '30px',
              color: 'rgba(255,255,255,0.55)',
              textAlign: 'center',
              maxWidth: '720px',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Real-time cricket scoring, tournaments and player stats
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            {['Live Scoring', 'Tournaments', 'Stats', 'Share'].map((feat) => (
              <div
                key={feat}
                style={{
                  padding: '10px 24px',
                  borderRadius: '100px',
                  background: 'rgba(22,163,74,0.15)',
                  border: '1px solid rgba(22,163,74,0.40)',
                  color: '#4ade80',
                  fontSize: '20px',
                  fontWeight: 600,
                  display: 'flex',
                }}
              >
                {feat}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            display: 'flex',
            alignItems: 'center',
            color: 'rgba(255,255,255,0.28)',
            fontSize: '18px',
          }}
        >
          cricket-scorer-yq3m.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
