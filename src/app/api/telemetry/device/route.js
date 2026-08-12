import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createRateLimiter } from "@/lib/rateLimit";

// ── Storage-exhaustion defence (§1.0B) ──
// This endpoint is unauthenticated by design: it measures anonymous visitors,
// and requiring a session would make the measurement useless. That makes it a
// free write primitive unless it is bounded.
//
// Three layers, because none of them is sufficient alone:
//
//   1. `src/proxy.js` already meters /api/:path* at 30 requests / 10s per IP
//      through Upstash. That is the strongest layer — but it is skipped
//      outside production AND it FAILS OPEN when Redis is unconfigured or
//      unreachable, because telemetry is not on the sensitive-path list. So
//      it cannot be the only thing standing between a loop and the database.
//
//   2. This in-process limiter, which needs no external service and so is
//      exactly the layer that survives a Redis outage. It is per-instance,
//      so the real ceiling is (limit × warm instances) — stated plainly
//      rather than implied away. Metered on the platform-supplied client IP,
//      NOT on the derived identity: the identity mixes in User-Agent, which
//      the caller controls, so metering on it would let a client mint a
//      fresh quota every request.
//
//   3. The (masked_ip, route_accessed) uniqueness invariant added in
//      migration 20260812000001, which is what actually caps STORAGE: past
//      both limiters, a flood can still only increment counters on a bounded
//      key space, never add rows without end.
const RATE_LIMIT_PER_MINUTE = 120;
const checkTelemetryRate = createRateLimiter({
  limit: RATE_LIMIT_PER_MINUTE,
  windowMs: 60_000,
  maxKeys: 20_000,
});

const DEVICE_TYPES = ["desktop", "mobile", "tablet"];
const SEARCH_CATEGORIES = [
  "all",
  "commercial",
  "residential",
  "industrial",
  "land",
  "office",
  "retail",
  "warehouse",
  "hospitality",
  "mixed_use",
];
const FRICTION_TYPES = [
  "abandoned_inquiry_modal",
  "zero_search_results",
  "slow_page",
];

const pathSchema = z.string().min(1).max(240)
  .startsWith("/")
  .regex(/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/, "Invalid path");
const baseShape = {
  deviceType: z.enum(DEVICE_TYPES),
  path: pathSchema,
};
const telemetrySchema = z.discriminatedUnion("eventType", [
  z.object({ ...baseShape, eventType: z.literal("pageview") }).strict(),
  z.object({
    ...baseShape,
    eventType: z.literal("friction"),
    frictionType: z.enum(FRICTION_TYPES),
  }).strict(),
  z.object({
    ...baseShape,
    eventType: z.literal("search"),
    searchCategory: z.enum(SEARCH_CATEGORIES),
    matchCount: z.number().int().min(0).max(100000),
  }).strict(),
]);

const PUBLIC_ROOTS = new Set([
  "about", "about-you", "badges", "brokers", "descent", "discover",
  "enterprise", "event-planners", "hubs", "intel", "layer", "login",
  "off-market", "onboarding", "photographers", "pricing", "privacy",
  "profile", "property", "researchers", "settings", "showcase", "terms",
  "transit", "wishlist",
]);
const DASHBOARD_SECTIONS = new Set(["calendar", "crm", "inbox", "inventory"]);
const LAYER_SECTIONS = new Set(["core", "crust", "mantle", "metropolis", "orbit", "stratosphere"]);
const PRICING_SECTIONS = new Set(["broker", "bundles", "creator", "owner", "seeker"]);
const DYNAMIC_ROOTS = new Set(["brokers", "event-planners", "hubs", "intel", "photographers", "profile", "property", "researchers"]);

export function classifyTelemetryPath(path) {
  if (path === "/") return "/";
  const parts = path.split("/").filter(Boolean);
  const root = parts[0];
  if (root === "dashboard") {
    const section = DASHBOARD_SECTIONS.has(parts[1]) ? parts[1] : null;
    return section ? `/dashboard/${section}` : "/dashboard";
  }
  if (!PUBLIC_ROOTS.has(root)) return "/other";
  if (root === "layer") return LAYER_SECTIONS.has(parts[1]) ? `/layer/${parts[1]}` : "/layer/other";
  if (root === "pricing") return PRICING_SECTIONS.has(parts[1]) ? `/pricing/${parts[1]}` : "/pricing/other";
  if (DYNAMIC_ROOTS.has(root) && parts.length > 1) return `/${root}/:item`;
  if (root === "wishlist" && parts.length > 1) return "/wishlist/:state";
  return `/${root}`;
}

function firstClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

export function deriveTelemetryIdentity(request, salt) {
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `telemetry_anon_${createHmac("sha256", salt)
    .update(`${firstClientIp(request)}:${userAgent}`)
    .digest("hex")
    .slice(0, 24)}`;
}

function safeGeo(request) {
  const encodedCity = request.headers.get("x-vercel-ip-city") || request.headers.get("cf-ipcity");
  let city = null;
  try {
    city = encodedCity ? decodeURIComponent(encodedCity).slice(0, 80) : null;
  } catch {
    city = null;
  }
  const rawCountry = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");
  const country = /^[A-Z]{2}$/.test(rawCountry || "") ? rawCountry : null;
  const rawLatitude = request.headers.get("x-vercel-ip-latitude");
  const rawLongitude = request.headers.get("x-vercel-ip-longitude");
  const latitudeValue = rawLatitude === null ? null : Number(rawLatitude);
  const longitudeValue = rawLongitude === null ? null : Number(rawLongitude);
  const latitude = Number.isFinite(latitudeValue) && latitudeValue >= -90 && latitudeValue <= 90 ? latitudeValue : null;
  const longitude = Number.isFinite(longitudeValue) && longitudeValue >= -180 && longitudeValue <= 180 ? longitudeValue : null;
  return { city, country, latitude, longitude };
}

function withoutOptionalGeo(payload) {
  const { city: _city, country: _country, latitude: _latitude, longitude: _longitude, ...base } = payload;
  return base;
}

function isGeoSchemaMismatch(error) {
  const message = String(error?.message || "");
  return /schema cache|column/i.test(message) && /city|country|latitude|longitude/i.test(message);
}

function isMissingPageviewRpc(error) {
  const message = String(error?.message || "");
  return error?.code === "PGRST202" ||
    (/schema cache|function/i.test(message) && /record_security_pageview/i.test(message));
}

function isMissingEventRpc(error) {
  const message = String(error?.message || "");
  return error?.code === "PGRST202" ||
    (/schema cache|function/i.test(message) && /record_security_event/i.test(message));
}
async function insertLog(payload) {
  const { error } = await supabaseAdmin.from("security_access_logs").insert(payload);
  if (!error) return;
  if (!isGeoSchemaMismatch(error)) throw error;

  const { error: fallbackError } = await supabaseAdmin
    .from("security_access_logs")
    .insert(withoutOptionalGeo(payload));
  if (fallbackError) throw fallbackError;
}

async function updateLog(id, payload) {
  const { error } = await supabaseAdmin.from("security_access_logs").update(payload).eq("id", id);
  if (!error) return;
  if (!isGeoSchemaMismatch(error)) throw error;

  const { error: fallbackError } = await supabaseAdmin
    .from("security_access_logs")
    .update(withoutOptionalGeo(payload))
    .eq("id", id);
  if (fallbackError) throw fallbackError;
}

// Counter semantics for every event type, not just pageviews.
//
// FRICTION: and SEARCH: rows used to be plain INSERTs, deliberately excluded
// from the pageview uniqueness invariant. That exclusion was the storage-
// exhaustion path: one row per request, forever. They are now upserted through
// the same (masked_ip, route_accessed) key, so repeat events increment a
// counter instead of adding rows.
//
// The pre-migration fallback still inserts, so this route stays correct on a
// database where 20260812000001 has not been applied yet.
async function recordEvent({ maskedIdentity, route, isFlagged, flagReason, geo, now }) {
  const { error: rpcError } = await supabaseAdmin.rpc("record_security_event", {
    p_masked_ip: maskedIdentity,
    p_route_accessed: route,
    p_is_flagged: !!isFlagged,
    p_flag_reason: flagReason ?? null,
    p_city: geo.city,
    p_country: geo.country,
    p_latitude: geo.latitude,
    p_longitude: geo.longitude,
    p_last_request_at: now,
  });
  if (!rpcError) return;
  if (!isMissingEventRpc(rpcError)) throw rpcError;

  await insertLog({
    masked_ip: maskedIdentity,
    route_accessed: route,
    request_count: 1,
    is_flagged: !!isFlagged,
    flag_reason: flagReason ?? null,
    ...geo,
    last_request_at: now,
  });
}

async function recordPageview({ maskedIdentity, route, geo, now }) {
  const rpcPayload = {
    p_masked_ip: maskedIdentity,
    p_route_accessed: route,

    p_city: geo.city,
    p_country: geo.country,
    p_latitude: geo.latitude,
    p_longitude: geo.longitude,
    p_last_request_at: now,
  };
  const { error: rpcError } = await supabaseAdmin.rpc("record_security_pageview", rpcPayload);
  if (!rpcError) return;
  if (!isMissingPageviewRpc(rpcError)) throw rpcError;

  // Safe compatibility path while the owner-gated migration is pending. limit(1)
  // tolerates historical duplicates; the migration merges them and makes future
  // increments atomic.
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("security_access_logs")
    .select("id, request_count")
    .eq("masked_ip", maskedIdentity)
    .eq("route_accessed", route)
    .order("last_request_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) {
    await updateLog(existing.id, {
      request_count: (existing.request_count || 1) + 1,
      ...geo,
      last_request_at: now,
    });
  } else {
    await insertLog({
      masked_ip: maskedIdentity,
      route_accessed: route,
      request_count: 1,
      is_flagged: false,
      ...geo,
      last_request_at: now,
    });
  }
}
export async function POST(request) {
  try {
    // Meter before parsing so a flood costs as little as possible.
    const rate = checkTelemetryRate(firstClientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many telemetry events" },
        {
          status: 429,
          headers: {
            "Cache-Control": "private, no-store",
            "Retry-After": String(rate.retryAfterSeconds),
          },
        },
      );
    }

    const parsed = telemetrySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid telemetry event" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Telemetry unavailable" }, { status: 503 });
    }
    const salt = process.env.IP_SALT;
    if (!salt) {
      return NextResponse.json({ success: false, error: "Telemetry unavailable" }, { status: 503 });
    }

    const event = parsed.data;
    const maskedIdentity = deriveTelemetryIdentity(request, salt);
    const route = classifyTelemetryPath(event.path);
    const geo = safeGeo(request);
    const now = new Date().toISOString();

    if (event.eventType === "friction") {
      await recordEvent({
        maskedIdentity,
        route: `FRICTION:${event.frictionType}:${route}`,
        isFlagged: true,
        flagReason: `User Friction: ${event.frictionType}`,
        geo,
        now,
      });
      return NextResponse.json({ success: true, eventType: event.eventType });
    }

    if (event.eventType === "search") {
      const zeroResult = event.matchCount === 0;
      await recordEvent({
        maskedIdentity,
        route: `SEARCH:${event.searchCategory}:${zeroResult ? "zero" : "matched"}:${route}`,
        isFlagged: zeroResult,
        flagReason: zeroResult ? "Zero Results Friction" : null,
        geo,
        now,
      });
      return NextResponse.json({ success: true, eventType: event.eventType });
    }

    await recordPageview({ maskedIdentity, route, geo, now });

    return NextResponse.json({ success: true, eventType: event.eventType, deviceType: event.deviceType });
  } catch (error) {
    console.error("[device-telemetry] write failed:", error?.message || "unknown error");
    return NextResponse.json(
      { success: false, error: "Telemetry unavailable" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}