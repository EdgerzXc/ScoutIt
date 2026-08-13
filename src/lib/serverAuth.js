import { createClient } from "@supabase/supabase-js";
import { isDevelopmentMockAllowed } from "@/lib/developmentMock";

export async function resolveUserId(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (token && token.trim() !== "") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) return user.id;
  }
  
  const requestHost = new URL(request.url).hostname;
  const isLocalE2E =
    process.env.SCOUTIT_E2E === "1" &&
    ["localhost", "127.0.0.1"].includes(requestHost);

  const mockUser = request.headers.get("x-mock-user-id");
  const readOnlyRequest = ["GET", "HEAD"].includes(request.method);
  if (isLocalE2E && readOnlyRequest && isDevelopmentMockAllowed({
    nodeEnv: process.env.NODE_ENV,
    e2eFlag: "1",
    hostname: requestHost,
    userId: mockUser,
  })) return mockUser;

  // Dev-only fallback -- rejected in production, where identity must come
  // from a verified session token (same gate as /api/dashboard/publish).
  return null;
}

export async function resolveServerTier(request) {
  const { isPreLaunchFreeMode } = await import("@/lib/featureFlags");
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin");

  if (await isPreLaunchFreeMode()) {
    return { tier: 'universe', freeMode: true };
  }

  const userId = await resolveUserId(request);
  if (!userId || !supabaseAdmin) return { tier: 'starry', freeMode: false };

  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle();

  return { tier: data?.subscription_tier || 'starry', freeMode: false };
}

/**
 * Legal-capacity gate (Civil Code 18+, RA 8792). NEW_IDEAS.md §34.2, §47.
 *
 * ✅ WIRED. Corrected 2026-08-06 (§59): this docstring said "THIS FUNCTION HAS
 * NO CALLERS YET … wiring it is §47.3" long after §48 wired it. Verified
 * callers:
 *   - '/api/deals/initiate:47'  (guarded by the dev-mock bypass)
 *   - '/api/deals/handshake:28'
 *
 * Left stale, this comment was worse than missing: a future session reading it
 * would conclude the legal age gate was unenforced and either re-wire it
 * redundantly or, worse, "discover" the gap and report it as a finding. Stale
 * status text is Rule 12's problem in miniature — an assertion that acquires
 * authority from sitting in the file it describes.
 *
 * ⚠️ Still NOT age-gated, deliberately unverified here: a plain Connect spend
 * outside these two routes. If you add a new spend path, add the gate.
 *
 * ── IT USED TO FAIL OPEN, IN TWO WAYS ──
 *
 * 1. It queried 'adult_eligibility_status', a column that did not exist until
 *    2026-08-06. Every call errored, 'profile' came back null, and
 *    'undefined !== "underage"' evaluated to TRUE — so the gate passed
 *    everyone, always.
 * 2. '!== "underage"' is the wrong test regardless. It asks "have we proven
 *    they are a child?" when the question is "have they told us they are an
 *    adult?" Anything unrecognised — null, a typo, a new status added later —
 *    read as eligible.
 *
 * Now it asks the right question and answers it conservatively.
 *
 * @returns {Promise<boolean>} true only when the user has positively attested
 *   (or been verified) as an adult.
 */
export async function assertAdultEligibility(userId) {
  if (!userId) return false;
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
  const { profileIsEligible } = await import("@/lib/adultEligibility");

  // No service client = cannot check. Previously returned true; that is a
  // misconfiguration silently disabling a legal gate.
  if (!supabaseAdmin) {
    console.error("[adultEligibility] No service client — cannot verify age. Denying.");
    return false;
  }

  const { data: profile, error } = await supabaseAdmin
    .from("user_profiles")
    .select("adult_eligibility_status, is_example_account, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[adultEligibility] Lookup failed — denying:", error.message);
    return false;
  }

  // The decision logic is pure and lives in lib/adultEligibility.js so it can
  // be tested exhaustively without a database. See §48 for the grandfather
  // cutoff — accounts predating 2026-08-06 pass on 'unknown', later ones do not.
  return profileIsEligible(profile);
}
