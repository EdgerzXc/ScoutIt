import crypto from "crypto";

/**
 * Constant-time string equality check to prevent timing attacks.
 */
export function timingSafeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Authorize a Vercel Cron invocation before any job dependency is touched.
 *
 * Vercel sends CRON_SECRET as `Authorization: Bearer <secret>`. A missing
 * server secret is a configuration failure, never a reason to make the route
 * public for local convenience.
 *
 * @param {Request} request
 * @returns {Response|null}
 */
export function authorizeCronRequest(request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { error: "Cron authorization is not configured" },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const expectedAuth = `Bearer ${secret}`;

  if (!timingSafeCompare(authHeader, expectedAuth)) {
    return Response.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  return null;
}

export default authorizeCronRequest;
