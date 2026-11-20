import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { consoleContentSecurityPolicy, useConsoleScriptNonce } from "@/lib/contentSecurityPolicy.mjs";

export async function middleware(request) {
  // Mission Control does not use next/image. Keep the optimizer unreachable
  // until the inherited Sharp advisory is removed by a compatible Next release.
  if (request.nextUrl.pathname.startsWith("/_next/image")) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const pathname = request.nextUrl.pathname;
  const rendersConsole = pathname === "/" || pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const policy = useConsoleScriptNonce && rendersConsole
    ? consoleContentSecurityPolicy(btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))))
    : null;

  function continueRequest() {
    if (!policy) return NextResponse.next({ request });
    const headers = new Headers(request.headers);
    headers.set("Content-Security-Policy", policy);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("Content-Security-Policy", policy);
    return response;
  }

  let supabaseResponse = continueRequest();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = continueRequest();
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

  const isAuthPage = request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/auth");
  // The scan-worker cron route authenticates itself with CRON_SECRET (no
  // browser session exists on a cron call) — let it through to its own check.
  const isCronRoute = request.nextUrl.pathname === "/api/scan/process";

  if (!user && !isAuthPage && !isCronRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/") {
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
