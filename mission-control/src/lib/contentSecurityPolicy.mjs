const turnstileOrigin = "https://challenges.cloudflare.com";

export const useConsoleScriptNonce = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "preview";

export function consoleContentSecurityPolicy(nonce) {
  const scriptSource = nonce ? `'nonce-${nonce}' 'strict-dynamic'` : "'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src 'self' ${scriptSource} ${turnstileOrigin}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}`.trim(),
    "frame-ancestors 'none'",
    `frame-src ${turnstileOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ") + ";";
}
