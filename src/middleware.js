import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Define limiters globally so they can be reused across requests
let standardLimiter;
let strictLimiter;
let aiLimiter;

function initLimiters() {
  if (!standardLimiter || !strictLimiter) {
    // Only init if env vars exist
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = Redis.fromEnv();
      
      standardLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(30, '10 s'),
        analytics: true,
      });

      strictLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(5, '10 s'),
        analytics: true,
      });

      aiLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(15, '10 s'),
        analytics: true,
      });
    }
  }
}

export async function middleware(request) {
  // Local dev / E2E runs fire hundreds of same-IP requests and were tripping
  // the limiter (429s mid-test-suite). Rate limiting is a production shield —
  // skip it entirely outside production builds.
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  // Initialize limiters if possible
  initLimiters();

  // Fail open if Upstash env vars are not set
  if (!standardLimiter) {
    return NextResponse.next();
  }

  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = request.nextUrl.pathname;

  let limiterToUse = standardLimiter;
  
  // Apply stricter limits to auth and ai routes
  if (path.startsWith('/api/auth/')) {
    limiterToUse = strictLimiter;
  } else if (path.startsWith('/api/ai/')) {
    limiterToUse = aiLimiter || standardLimiter;
  }

  try {
    const { success, limit, reset, remaining } = await limiterToUse.limit(`ratelimit_${ip}`);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', limit.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', reset.toString());
    return res;

  } catch (err) {
    // If Redis fails, fail open to avoid bringing down the app
    console.error('[RateLimiter] Error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/api/:path*',
};
