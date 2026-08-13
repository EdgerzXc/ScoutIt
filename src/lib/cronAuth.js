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

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
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
