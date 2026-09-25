import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId, assertAdultEligibility } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import {
  validateDraft,
  scoutIdFor,
  capacityCheck,
  POSTABLE_SIGNAL_TYPES,
} from "@/lib/communityPosting";
import { listLiveSignals, countActiveSignals, geocodeSignalScope, isMissingTable } from "@/lib/communityStore";

// ─────────────────────────────────────────────────────────────────────────
// COMMUNITY SIGNALS FEED + POSTING (A-145 P1)
// GET is public (browse-only for guests, spec §3). POST needs a signed-in
// adult account; anonymous *display* is a per-post choice, never a way to
// post without an account. Both fail closed with honest messages while the
// P1 tables are absent (O-004 row 11).
// ─────────────────────────────────────────────────────────────────────────

const checkFeedRate = createRateLimiter({ limit: 60, windowMs: 60_000, maxKeys: 20_000 });
const checkPostRate = createRateLimiter({ limit: 5, windowMs: 60_000, maxKeys: 5_000 });

export async function GET(request) {
  const rate = checkFeedRate(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }
  try {
    const url = new URL(request.url);
    const result = await listLiveSignals({
      district: url.searchParams.get("district") || null,
      signalType: POSTABLE_SIGNAL_TYPES.includes(url.searchParams.get("signalType"))
        ? url.searchParams.get("signalType")
        : null,
      limit: url.searchParams.get("limit") || 60,
    });
    if (result.missing) {
      return NextResponse.json(
        { ok: true, signals: [], degraded: true, message: "Community posting is opening soon. Samples below show how it will read." },
        { status: 200 }
      );
    }
    return NextResponse.json({ ok: true, signals: result.signals });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json(
        { ok: true, signals: [], degraded: true, message: "Community posting is opening soon." },
        { status: 200 }
      );
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}

function accountClassFor(profile) {
  const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
  if (roles.includes("broker")) return "broker";
  if (roles.includes("owner")) return "owner";
  return "standard";
}

export async function POST(request) {
  const rate = checkPostRate(`${clientIp(request)}`);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "Slow down — try posting again in a minute." }, { status: 429 });
  }
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Sign in to post a signal. Browsing stays open to everyone." },
        { status: 401 }
      );
    }
    if (!(await assertAdultEligibility(userId))) {
      return NextResponse.json(
        { ok: false, error: "Posting needs an 18+ account." },
        { status: 403 }
      );
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: "Server error: missing service role configuration" }, { status: 500 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { ok, errors, normalized } = validateDraft({ ...(body || {}), authorAccountId: userId });
    if (!ok) {
      const redirect = errors.some((e) => e.code === "LISTING_SHAPED");
      return NextResponse.json(
        { ok: false, errors, redirectToMetropolis: redirect },
        { status: 422 }
      );
    }

    // Capacity before write (spec §10): closed/expired rows never count.
    let profile = null;
    try {
      const { data } = await supabaseAdmin
        .from("user_profiles")
        .select("active_roles")
        .eq("id", userId)
        .maybeSingle();
      profile = data || null;
    } catch (err) {
      if (isMissingTable(err)) {
        return NextResponse.json(
          { ok: false, error: "Community posting is opening soon. Nothing was saved." },
          { status: 503 }
        );
      }
      throw err;
    }
    const counted = await countActiveSignals(userId);
    if (counted.missing) {
      return NextResponse.json(
        { ok: false, error: "Community posting is opening soon. Nothing was saved." },
        { status: 503 }
      );
    }
    const cap = capacityCheck(counted.count, accountClassFor(profile));
    if (!cap.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: `You hold ${cap.activeCount} of ${cap.cap} active signals. Close or refresh an older one instead of stacking a new post — one current signal wins.`,
        },
        { status: 403 }
      );
    }

    const scoutId = scoutIdFor(userId);
    // Best-effort district pin so the post can join the radar. Never blocks
    // publishing and never invents precision: unresolvable stays unpinned.
    const geo = await geocodeSignalScope({ district: normalized.district, city: normalized.city });
    if (geo) {
      normalized.lat = geo.lat;
      normalized.lng = geo.lng;
      normalized.precisionLevel = "district";
    }
    const { data: signal, error: signalError } = await supabaseAdmin
      .from("stratosphere_signals")
      .insert({
        author_account_id: userId,
        scout_id_snapshot: scoutId,
        public_identity_mode: normalized.identityMode,
        signal_type: normalized.signalType,
        commercial_flag: normalized.commercialFlag,
        status: "live",
        title: normalized.title,
        body: normalized.body,
      })
      .select("id")
      .single();
    if (signalError) {
      if (isMissingTable(signalError)) {
        return NextResponse.json(
          { ok: false, error: "Community posting is opening soon. Nothing was saved." },
          { status: 503 }
        );
      }
      throw signalError;
    }

    try {
      const { error: locError } = await supabaseAdmin.from("signal_locations").insert({
        signal_id: signal.id,
        region: normalized.region,
        city: normalized.city,
        district: normalized.district,
        building_name: normalized.buildingName,
        precision_level: normalized.precisionLevel,
        lat: normalized.lat,
        lng: normalized.lng,
      });
      if (locError) throw locError;
      const { error: reqError } = await supabaseAdmin.from("signal_requirements").insert({
        signal_id: signal.id,
        transaction_type: normalized.transactionType,
        space_type: normalized.spaceType,
        budget_min: normalized.budgetMin,
        budget_max: normalized.budgetMax,
        size_min_sqm: normalized.sizeMinSqm,
        size_max_sqm: normalized.sizeMaxSqm,
        timing: normalized.timing,
        must_have: normalized.mustHave,
        preferred: normalized.preferred,
      });
      if (reqError) throw reqError;
    } catch (err) {
      // Partial write rolls back so a post is whole or never happened.
      await supabaseAdmin.from("stratosphere_signals").delete().eq("id", signal.id);
      throw err;
    }

    return NextResponse.json(
      { ok: true, id: signal.id, scoutId, status: "live" },
      { status: 201 }
    );
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json(
        { ok: false, error: "Community posting is opening soon. Nothing was saved." },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
