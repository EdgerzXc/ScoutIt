import { supabaseAdmin } from "./supabaseAdmin";

// A4 — server-side feature-flag reader for the public site.
// Flags live in the `feature_flags` table and are toggled from Master Mission
// Control (dashboard/features). Cached in-process for 30s so a toggle
// propagates fast without a DB read on every request. FAILS SAFE: if the
// table is unreachable, each flag falls back to the provided default.

const CACHE_TTL_MS = 30 * 1000;
let cache = { flags: null, fetchedAt: 0 };

async function loadFlags() {
  const now = Date.now();
  if (cache.flags && now - cache.fetchedAt < CACHE_TTL_MS) return cache.flags;

  try {
    if (!supabaseAdmin) throw new Error("admin client unavailable");
    const { data, error } = await supabaseAdmin
      .from("feature_flags")
      .select("id, is_enabled");
    if (error) throw error;
    cache = {
      flags: Object.fromEntries((data || []).map((f) => [f.id, !!f.is_enabled])),
      fetchedAt: now,
    };
  } catch {
    // Keep the stale cache if we have one; otherwise empty (defaults apply).
    if (!cache.flags) cache = { flags: {}, fetchedAt: now };
  }
  return cache.flags;
}

/** Read one flag with a fail-safe default. */
export async function getFlag(id, defaultValue = false) {
  const flags = await loadFlags();
  return id in flags ? flags[id] : defaultValue;
}

/** The kill switch: when true, all mutating public-site routes refuse writes. */
export async function isGlobalReadOnly() {
  // Default false — if the flag table is unreachable the site keeps working.
  return getFlag("global_read_only", false);
}

/** Pre-launch free mode (all premium features unlocked while seeding). */
export async function isPreLaunchFreeMode() {
  return getFlag("pre_launch_free_mode", true);
}
