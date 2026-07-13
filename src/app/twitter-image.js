import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ScoutIt — Space Intelligence';
export const size = { width: 1200, height: 600 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0d0d0d',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(232, 174, 60, 0.2)',
            borderRadius: '50%',
            width: '120px',
            height: '120px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: 60,
              color: '#E8AE3C',
            }}
          >
            🛸
          </div>
        </div>
        <div
          style={{
            fontSize: 72,
            fontFamily: 'sans-serif',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            marginBottom: '20px',
          }}
        >
          Scout<span style={{ color: '#E8AE3C' }}>It</span>
        </div>
        <div
          style={{
            fontSize: 32,
            fontFamily: 'sans-serif',
            color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Space Intelligence
        </div>
      </div>
    ),
    { ...size }
  );
}
