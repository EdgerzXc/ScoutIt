import { supabaseAdmin } from "./supabaseAdmin";
import { freshnessFor, isLiveStatus } from "./communityPosting";
import { getServerMapboxToken } from "./mapboxToken";
import { fetchWithRetry } from "./fetchWithRetry";
import { BoundedCache } from "./boundedCache";

// ─────────────────────────────────────────────────────────────────────────
// COMMUNITY STORE (A-145 P1, server-only)
// Every function here runs with the service role and fails closed when the
// P1 tables are absent (O-004 row 11, NOT APPLIED): callers get { missing:
// true } and answer 503 with an honest message — never an empty feed that
// reads as "nobody posted" and never a write that vanishes.
// ─────────────────────────────────────────────────────────────────────────

export function isMissingTable(error) {
  const code = error?.code;
  const msg = String(error?.message || "");
  return code === "42P01" || /relation .* does not exist/i.test(msg);
}

function formatBudget(min, max) {
  if (min == null && max == null) return null;
  const fmt = (n) => `₱${Number(n).toLocaleString("en-PH")}`;
  if (min != null && max != null && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max);
}

function formatSize(min, max) {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return { min, max };
  return min ?? max;
}

/** Map one DB row (+ location + requirements) to the dossier-card shape. */
export function mapDbSignalToCard(row, location = {}, requirements = {}, now = new Date()) {
  const freshness = freshnessFor(row.last_confirmed_at, now);
  const district = location.district || location.city || "";
  const coords =
    location.precision_level === "exact" &&
    Number.isFinite(Number(location.lat)) &&
    Number.isFinite(Number(location.lng))
      ? { lat: Number(location.lat), lng: Number(location.lng) }
      : null;
  const mustHave = Array.isArray(requirements.must_have) ? requirements.must_have : [];
  return {
    id: row.id,
    title: row.title,
    signalType: row.signal_type,
    category: requirements.space_type || "",
    spaceType: requirements.space_type || "",
    location: [location.building_name, district].filter(Boolean).join(" · ") || location.city || "",
    district,
    city: location.city || "",
    coords,
    areaSqm: formatSize(requirements.size_min_sqm, requirements.size_max_sqm),
    budget: formatBudget(requirements.budget_min, requirements.budget_max),
    timing: requirements.timing || "",
    specs: mustHave.slice(0, 8),
    summary: row.body,
    requirements: requirements.transaction_type
      ? { transaction: requirements.transaction_type }
      : {},
    sourceName: "",
    sourceUrl: "",
    actionType: "CONNECT",
    glyphType: "volume",
    glyphData: {},
    author: {
      scoutId: row.scout_id_snapshot,
      mode: row.public_identity_mode === "anonymous" ? "anonymous" : "public",
      ...(row.public_identity_mode === "anonymous" ? {} : { name: row.author_display_name || row.scout_id_snapshot }),
      trustTier: "SCOUTIT MEMBER",
      verified: false,
    },
    freshness,
    relevantCount: row.relevant_count || 0,
    savedCount: row.saved_count || 0,
    matchingSpaces: [],
    createdAt: row.created_at,
    isSample: false,
    liveCommunity: true,
  };
}

/** Public feed: LIVE rows only, expired filtered, newest first. */
export async function listLiveSignals({ district = null, signalType = null, limit = 60 } = {}) {
  if (!supabaseAdmin) return { missing: true };
  try {
    let query = supabaseAdmin
      .from("stratosphere_signals")
      .select(
        "id, author_account_id, scout_id_snapshot, public_identity_mode, signal_type, commercial_flag, status, title, body, relevant_count, saved_count, created_at, last_confirmed_at"
      )
      .in("status", ["live", "limited"])
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(Number(limit) || 60, 1), 100));
    if (signalType) query = query.eq("signal_type", signalType);
    const { data: rows, error } = await query;
    if (error) {
      if (isMissingTable(error)) return { missing: true };
      throw error;
    }
    if (!rows || rows.length === 0) return { signals: [] };
    const ids = rows.map((r) => r.id);
    const [{ data: locations }, { data: reqs }] = await Promise.all([
      supabaseAdmin.from("signal_locations").select("*").in("signal_id", ids),
      supabaseAdmin.from("signal_requirements").select("*").in("signal_id", ids),
    ]);
    const locById = new Map((locations || []).map((l) => [l.signal_id, l]));
    const reqById = new Map((reqs || []).map((r) => [r.signal_id, r]));
    const now = new Date();
    let signals = rows.map((row) =>
      mapDbSignalToCard(row, locById.get(row.id) || {}, reqById.get(row.id) || {}, now)
    );
    // Expired rows leave the feed until refreshed (spec §10). Unpinned rows
    // (no trusted coords) stay readable in the dossier — honest absence.
    signals = signals.filter((s) => s.freshness !== "expired");
    if (district) signals = signals.filter((s) => s.district === district);
    // Author display names for public-mode posts (best effort; Scout ID holds).
    const publicIds = [...new Set(signals.filter((s) => s.author.mode === "public").map((s) => s.id))];
    if (publicIds.length > 0) {
      const authorIds = rows.filter((r) => publicIds.includes(r.id)).map((r) => r.author_account_id);
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name")
        .in("id", [...new Set(authorIds)]);
      const nameById = new Map((profiles || []).map((p) => [p.id, p.display_name]));
      const rowById = new Map(rows.map((r) => [r.id, r]));
      signals = signals.map((s) =>
        s.author.mode === "public"
          ? {
              ...s,
              author: {
                ...s.author,
                name: nameById.get(rowById.get(s.id)?.author_account_id) || s.author.scoutId,
              },
            }
          : s
      );
    }
    return { signals };
  } catch (error) {
    if (isMissingTable(error)) return { missing: true };
    throw error;
  }
}

const scopeGeocodeCache = new BoundedCache({ maxEntries: 500 });

/**
 * Geocode a signal's district/city scope so live posts can pin the radar.
 * Server-only (the token never leaves here). Best-effort by design: an
 * unresolvable scope keeps the post readable in the dossier without a pin —
 * honest absence beats a misplaced pin. Precision is always district-level;
 * only a user-dropped pin may ever claim exact.
 */
export async function geocodeSignalScope({ district = "", city = "" } = {}, fetchImpl = fetchWithRetry) {
  // No scope, no call: bare "Philippines" would pin a city-level post to a
  // country centroid and invent precision the author never gave.
  if (!district.trim() && !city.trim()) return null;
  const query = [district, city, "Philippines"].filter(Boolean).join(", ");
  if (scopeGeocodeCache.has(query)) return scopeGeocodeCache.get(query);
  const token = getServerMapboxToken();
  if (!token) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?country=ph&limit=1&access_token=${token}`;
    const res = await fetchImpl(url, {}, {
      circuit: "mapbox",
      budgetMs: 3500,
      attemptTimeoutMs: 2500,
      retries: 1,
    });
    const data = await res.json();
    const center = data?.features?.[0]?.center;
    const result =
      Array.isArray(center) && Number.isFinite(center[0]) && Number.isFinite(center[1])
        ? { lng: center[0], lat: center[1] }
        : null;
    scopeGeocodeCache.set(query, result); // cache misses too: don't re-ask
    return result;
  } catch {
    return null;
  }
}

/** Count an author's countable rows (live/limited/under_review) for capacity. */
export async function countActiveSignals(authorAccountId) {
  const { data, error } = await supabaseAdmin
    .from("stratosphere_signals")
    .select("id")
    .eq("author_account_id", authorAccountId)
    .in("status", ["live", "limited", "under_review", "needs_edit"]);
  if (error) {
    if (isMissingTable(error)) return { missing: true };
    throw error;
  }
  return { count: (data || []).length };
}
