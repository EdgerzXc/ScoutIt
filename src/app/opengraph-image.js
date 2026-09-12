import { ImageResponse } from 'next/og';
import ScoutItImageWordmark from '@/components/brand/ScoutItImageWordmark';
import ScoutItImageMark from '@/components/brand/ScoutItImageMark';

export const runtime = 'edge';
export const alt = 'ScoutIt — Space Intelligence';
export const size = { width: 1200, height: 630 };
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
        <ScoutItImageMark fill="#E8AE3C" />
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
