import { ImageResponse } from 'next/og';
import ScoutItImageWordmark from '@/components/brand/ScoutItImageWordmark';

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
          '--bg': '#0d0d0d',
          '--accent': '#E8AE3C',
          '--text-primary': '#ffffff',
          backgroundColor: 'var(--bg)',
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
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <ScoutItImageWordmark />
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
