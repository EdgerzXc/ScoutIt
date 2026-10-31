import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { isEntitledOffMarketViewer, isOffMarket } from "@/lib/propertyLifecycle";
import { MONETIZATION_PHASES, PIONEER_ACCESS_BADGE_TEXT } from "@/lib/monetizationGate";
import { resolveServerMonetizationPhase, recordServerConversionIntent } from "@/lib/serverMonetizationGate";
import { sanitizeError } from "@/lib/sanitizeError";

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server configuration unavailable" }, { status: 500 });

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id, role, active_roles, subscription_tier")
      .eq("id", userId)
      .maybeSingle();

    const monetizationPhase = await resolveServerMonetizationPhase({ client: supabaseAdmin });
    let lockerOpen =
      process.env.SCOUTIT_PRE_200_PREMIUM_LOCKER === "true" ||
      monetizationPhase === MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;
    if (!lockerOpen && process.env.NEXT_PUBLIC_MONETIZATION_PHASE !== MONETIZATION_PHASES.PRODUCTION_ENFORCED) {
      const { data: flags } = await supabaseAdmin
        .from("feature_flags")
        .select("id, is_enabled")
        .in("id", ["premium_features_unlocked", "pre_200_premium_access", "pilot_zero_paywall"]);
      lockerOpen = (flags || []).some((flag) => flag.is_enabled === true);
    }

    const userTier = profile?.subscription_tier || "starry";
    if (lockerOpen && String(userTier).toLowerCase() !== "universe") {
      await recordServerConversionIntent({
        client: supabaseAdmin,
        userId,
        phase: MONETIZATION_PHASES.PILOT_ZERO_PAYWALL,
        feature: "off_market_vault",
        role: "seeker",
        tier: "universe",
        source: "/api/off-market",
      });
    }
    const isUniverseSeeker = isEntitledOffMarketViewer({ tier: userTier, lockerOpen });

    const rawSlug = new URL(request.url).searchParams.get("slug");
    if (rawSlug && !/^[a-z0-9-_]+$/i.test(rawSlug)) {
      return NextResponse.json({ error: "Invalid property slug" }, { status: 400 });
    }
    const slug = rawSlug || null;
    let query = supabaseAdmin
      .from("properties")
      .select("id, owner_id, slug, canonical_slug, title, location, type, space_category, lifecycle_state, pipeline_status, quietly_open_to_offers, withdrawn_at, last_verified_date, details, price, media_link")
      .eq("pipeline_status", "off_market")
      .order("withdrawn_at", { ascending: false });

    // GAP-110: Query both canonical_slug and legacy slug so older or unmigrated off-market rows resolve
    if (slug) query = query.or(`canonical_slug.eq.${slug},slug.eq.${slug}`);
    const { data: rows, error } = await query;
    if (error) return NextResponse.json({ error: "Unable to read off-market inventory" }, { status: 500 });

    const visible = [];
    for (const row of rows || []) {
      if (!isOffMarket(row)) continue;
      const isOwner = row.owner_id === userId;

      // Owner can always see their own off-market assets
      if (isOwner) {
        visible.push({
          id: row.id,
          slug: row.canonical_slug || row.slug,
          title: row.title,
          location: row.location,
          type: row.type,
          spaceCategory: row.space_category,
          quietlyOpenToOffers: row.quietly_open_to_offers === true,
          whisperPrice: row.price || row.details?.whisper_price || row.details?.price || null,
          image: row.media_link || row.details?.images?.[0] || null,
          withdrawnAt: row.withdrawn_at,
          lastVerifiedDate: row.last_verified_date || null,
          contactAvailable: row.quietly_open_to_offers === true,
          isOwner: true,
          contactPreference: row.details?.contact_preference || "owner_and_brokers",
        });
        continue;
      }

      // Non-owner: Must be Universe seeker AND property must have quietly_open_to_offers === true
      if (isUniverseSeeker && row.quietly_open_to_offers === true) {
        visible.push({
          id: row.id,
          slug: row.canonical_slug || row.slug,
          title: row.title,
          location: row.location,
          type: row.type,
          spaceCategory: row.space_category,
          quietlyOpenToOffers: true,
          whisperPrice: row.price || row.details?.whisper_price || row.details?.price || null,
          image: row.media_link || row.details?.images?.[0] || null,
          withdrawnAt: row.withdrawn_at,
          lastVerifiedDate: row.last_verified_date || null,
          contactAvailable: true,
          isOwner: false,
          contactPreference: row.details?.contact_preference || "owner_and_brokers",
        });
      }
    }

    if (slug && visible.length === 0) {
      return NextResponse.json({ error: "Off-market property not found or not entitled" }, { status: 404 });
    }
    return NextResponse.json({
      properties: visible,
      isUniverseSeeker,
      userTier,
      monetizationPhase,
      badgeText: lockerOpen ? PIONEER_ACCESS_BADGE_TEXT : null,
    });
  } catch (error) {
    console.error("[OFF-MARKET API] Error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
