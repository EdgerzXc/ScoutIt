const { createHmac } = require("node:crypto");
const { CURRENT_TERMS_VERSION } = require("../../src/lib/legalVersions.js");

const origin = "https://scoutit-staff-e2e.supabase.co";
const fixtureEnv = {
  NEXT_PUBLIC_SUPABASE_URL: origin,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-staff-anon",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-staff-service",
  SCOUTIT_ADMIN_SESSION_KEY: Buffer.alloc(32, 17).toString("base64url"),
  SCOUTIT_STAFF_E2E_PROVIDER: "1",
};
const identities = {
  staff: { id: "00000000-0000-4000-8000-000000000011", role: "admin", aal: "aal2", enrolled: true },
  ordinary: { id: "00000000-0000-4000-8000-000000000012", role: "owner", aal: "aal2", enrolled: true },
  aal1: { id: "00000000-0000-4000-8000-000000000013", role: "admin", aal: "aal1", enrolled: true },
  unenrolled: { id: "00000000-0000-4000-8000-000000000014", role: "admin", aal: "aal1", enrolled: false },
};
const accountFor = ({ id, enrolled }) => ({
  id,
  email: `${id.slice(-2)}@scoutit-fixture.test`,
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  factors: enrolled ? [{ id: "00000000-0000-4000-8000-000000000022", factor_type: "totp", status: "verified" }] : [],
});
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const sign = (value) => createHmac("sha256", "scoutit-local-test-auth-only").update(value).digest("base64url");

function fixtureSession(kind) {
  const account = identities[kind];
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: account.id, aal: account.aal, exp: expires, aud: "authenticated", role: "authenticated",
  })}`;
  return {
    access_token: `${jwt}.${sign(jwt)}`,
    refresh_token: "fixture-staff-refresh",
    expires_at: expires,
    expires_in: 3600,
    token_type: "bearer",
    user: accountFor(account),
  };
}

function identityFromToken(token) {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[2] !== sign(parts.slice(0, 2).join("."))) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url"));
    return claims.exp > Date.now() / 1000
      ? Object.values(identities).find(({ id, aal }) => id === claims.sub && aal === claims.aal)
      : null;
  } catch {
    return null;
  }
}

function fixtureResponse(url, method, headers) {
  if (url.pathname === "/auth/v1/user" && method === "GET") {
    const identity = identityFromToken((headers.get("authorization") || "").replace(/^Bearer /i, ""));
    if (identity) return Response.json(accountFor(identity));
    return Response.json({ message: "No test session" }, { status: 401 });
  }
  if (url.pathname === "/auth/v1/logout" && method === "POST") return new Response(null, { status: 204 });
  if (url.pathname === "/rest/v1/user_profiles" && method === "GET") {
    const id = url.searchParams.get("id")?.slice(3);
    const identity = Object.values(identities).find((account) => account.id === id);
    const profile = identity && {
      id, role: identity.role, active_roles: [identity.role], full_name: "Fixture Staff", primary_mode: "owner",
      adult_eligibility_status: "declared_adult", onboarding_completed_at: "2026-11-09T00:00:00Z",
      terms_accepted_at: "2026-11-09T00:00:00Z", terms_version: CURRENT_TERMS_VERSION,
    };
    if (headers.get("accept")?.includes("application/vnd.pgrst.object+json")) return Response.json(profile || null);
    return Response.json(profile ? [profile] : []);
  }
  return Response.json([]);
}

if (process.env.SCOUTIT_STAFF_E2E_PROVIDER === "1" && process.env.NEXT_PUBLIC_SUPABASE_URL === origin) {
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const requestUrl = new URL(input instanceof Request ? input.url : String(input));
    if (requestUrl.origin !== origin) return nativeFetch(input, options);
    const method = options?.method || (input instanceof Request ? input.method : "GET");
    const headers = new Headers(options?.headers || (input instanceof Request ? input.headers : undefined));
    return fixtureResponse(requestUrl, method, headers);
  };
}

module.exports = { origin, fixtureEnv, fixtureSession, fixtureResponse };
