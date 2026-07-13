import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Dynamic parameters
    const title = searchParams.get('title') || 'Premium Real Estate Intelligence';
    const category = searchParams.get('category') || 'Commercial Space';
    const sqm = searchParams.get('sqm') || '';
    const image = searchParams.get('image');

    // ScoutIt aesthetic: 95% black (#0d0d0d), 5% gold (#E8AE3C)
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backgroundColor: '#0d0d0d',
            backgroundImage: image ? `url(${image})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark gradient overlay for readability and 95% black aesthetic */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to top, rgba(13,13,13,1) 0%, rgba(13,13,13,0.8) 40%, rgba(13,13,13,0.2) 100%)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '60px',
              zIndex: 10,
            }}
          >
            {/* Logo/Brand */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  color: '#E8AE3C',
                  fontSize: 28,
                  fontWeight: 'bold',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                }}
              >
                SCOUTIT
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 64,
                fontFamily: 'sans-serif',
                color: 'white',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: '24px',
                maxWidth: '900px',
              }}
            >
              {title}
            </div>

            {/* Spec Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(232,174,60,0.3)',
                  padding: '8px 16px',
                  borderRadius: '4px',
                }}
              >
                <span
                  style={{
                    color: '#E8AE3C',
                    fontSize: 20,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  {category}
                </span>
              </div>

              {sqm && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                  }}
                >
                  <span
                    style={{
                      color: 'white',
                      fontSize: 20,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                    }}
                  >
                    {sqm} SQM
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
