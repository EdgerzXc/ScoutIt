import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;
const rateBuckets = new Map();

function checkMcRate(ip) {
  const now = Date.now();
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets.entries()) {
      if (now >= v.resetAt) rateBuckets.delete(k);
    }
  }
  const entry = rateBuckets.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 60 };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfter: 60 };
}

function getClientIp(request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || "unknown";
  return "unknown";
}

function matchesRequestOrigin(headerValue, expectedOrigin) {
  if (!headerValue) return false;
  try {
    return new URL(headerValue).origin === expectedOrigin;
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname, searchParams, origin: requestOrigin } = request.nextUrl;

  // Mission Control does not use next/image. Keep the optimizer unreachable
  // until the inherited Sharp advisory is removed by a compatible Next release.
  if (pathname.startsWith("/_next/image")) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const isCronRoute = pathname === "/api/scan/process";
  const isApiRoute = pathname.startsWith("/api/");
  const isAuthActionRoute = pathname.startsWith("/auth/");
  const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase());

  if ((isApiRoute || isAuthActionRoute) && !isCronRoute) {
    const rate = checkMcRate(getClientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before retrying." },
        {
          status: 429,
          headers: {
            "Cache-Control": "private, no-store",
            "Retry-After": String(rate.retryAfter),
          },
        }
      );
    }

    if (isWriteMethod) {
      const originHeader = request.headers.get("origin");
      const refererHeader = request.headers.get("referer");
      const sameOrigin = originHeader
        ? matchesRequestOrigin(originHeader, requestOrigin)
        : matchesRequestOrigin(refererHeader, requestOrigin);
      if (!sameOrigin) {
        return NextResponse.json(
          { error: "Forbidden: Cross-origin write rejected" },
          { status: 403, headers: { "Cache-Control": "private, no-store" } }
        );
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-mc-pathname");
  requestHeaders.set("x-mc-pathname", pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = pathname === "/" || pathname.startsWith("/auth");

  if (!user && !isAuthPage && !isCronRoute) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/" && !searchParams.has("error")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
