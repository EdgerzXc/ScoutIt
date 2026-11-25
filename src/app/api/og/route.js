import { ImageResponse } from 'next/og';
import ScoutItImageWordmark from '@/components/brand/ScoutItImageWordmark';
import ScoutItImageMark from '@/components/brand/ScoutItImageMark';

export const runtime = 'edge';

const ALLOWED_OG_IMAGE_HOSTS = new Set([
  'dl.airtable.com',
  'v5.airtableusercontent.com',
  'scoutit.space',
  'www.scoutit.space',
]);

function isAllowedOgImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.length > 2000) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.toLowerCase()
      : null;
    if (
      ALLOWED_OG_IMAGE_HOSTS.has(host) ||
      host.endsWith('.supabase.co') ||
      (supabaseHost && host === supabaseHost)
    ) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Bounded parameters & SSRF-safe HTTPS allowlisted image source
    const rawTitle = (searchParams.get('title') || 'Premium Real Estate Intelligence').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
    const rawCategory = (searchParams.get('category') || 'Commercial Space').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
    const rawSqm = (searchParams.get('sqm') || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
    const title = rawTitle.slice(0, 140) || 'Premium Real Estate Intelligence';
    const category = rawCategory.slice(0, 48) || 'Commercial Space';
    const sqm = /^[0-9.,+\-\s]{1,24}$/.test(rawSqm) ? rawSqm : '';
    const image = isAllowedOgImageUrl(searchParams.get('image'));

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
            '--bg': '#0d0d0d',
            '--accent': '#E8AE3C',
            '--text-primary': '#ffffff',
            backgroundColor: 'var(--bg)',
            ...(image ? { backgroundImage: `url(${image})` } : {}),
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
              <ScoutItImageMark fill="#E8AE3C" size={34} marginBottom="0" />
              <div style={{ display: 'flex', width: '12px' }} />
              <ScoutItImageWordmark fontSize={28} fontWeight={700} letterSpacing="0.12em" />
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
        headers: {
          // The card is a pure function of the query string - same params in,
          // same pixels out - so it is safe to cache hard and there is no
          // revalidation to do.
          //
          // It previously served `max-age=0, must-revalidate`, so every
          // Facebook, X, LinkedIn and Viber scrape re-rendered a ~1MB PNG from
          // scratch AND re-fetched the source photo from its origin. A scrape
          // that times out renders no card at all, which is the whole point of
          // the image. Cached, the first scrape pays and the rest are free.
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        },
      }
    );
  } catch (e) {
    console.error(e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
