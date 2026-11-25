import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  resolvePrimaryContact,
  getViaCookieName,
  serializeViaCookie,
  parseViaCookie,
  VIA_STATUS,
  ROUTING_REASONS,
  DEFAULT_VIA_ATTRIBUTION_DAYS,
} from "@/lib/viaRouting";
import { resolveServerViaAttribution, recordRoutingDecision } from "@/lib/serverViaRouting";
import { getPropertyLeadRecipients } from "@/lib/serverBrokerRouting";
import { normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const checkViaGetRate = createRateLimiter({
  limit: 60,
  windowMs: 60_000,
  maxKeys: 10_000,
});

const checkViaPostRate = createRateLimiter({
  limit: 30,
  windowMs: 60_000,
  maxKeys: 10_000,
});

export async function GET(request, { params }) {
  try {
    const rate = checkViaGetRate(clientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many VIA attribution requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { id: slug } = await params;
    if (!slug || !SAFE_ID.test(slug)) {
      return NextResponse.json({ error: "Invalid or missing property identifier" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const requestedPromoter = searchParams.get("promoter");
    const visitorIdParam = searchParams.get("visitor_id") || "anon_" + Math.random().toString(36).substring(2, 12);

    // 1. Resolve live public property from Supabase
    let property = null;
    if (supabaseAdmin) {
      const isUuid = UUID_RE.test(slug);
      const query = supabaseAdmin.from("properties").select("id, title, slug, canonical_slug, lifecycle_state, pipeline_status");
      const { data } = await (isUuid
        ? query.eq("id", slug)
        : query.or(`canonical_slug.eq.${slug},slug.eq.${slug}`)
      ).maybeSingle();
      if (!data || normalizeLifecycleState(data) !== PROPERTY_LIFECYCLE_STATES.LIVE) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404, headers: NO_STORE }
        );
      }
      property = data;
    }

    const propertyId = property?.id || slug;
    const cookieName = getViaCookieName(propertyId);
    const cookieValue = request.cookies.get(cookieName)?.value;
    const cookieAttribution = parseViaCookie(cookieValue);

    // Determine promoter slug to check (query param takes precedence, then cookie)
    const activePromoterSlug = requestedPromoter || cookieAttribution?.promoterSlug;

    // 2. Fetch eligible contacts for this property
    let eligibleContacts = [];
    if (supabaseAdmin && property?.id) {
      const routingResult = await getPropertyLeadRecipients(supabaseAdmin, property.id);
      if (routingResult.ok && Array.isArray(routingResult.recipients)) {
        eligibleContacts = routingResult.recipients;
      }
    }

    // 3. Resolve VIA attribution if promoter slug is present
    let viaResult = null;
    let promoterProfile = null;

    if (activePromoterSlug && supabaseAdmin && property?.id) {
      viaResult = await resolveServerViaAttribution(supabaseAdmin, {
        propertyId: property.id,
        promoterSlug: activePromoterSlug,
        visitorId: visitorIdParam,
      });

      // Only a verified share link may expose a promoter. Never synthesize a
      // persona from the raw slug, and honour profile privacy.
      const promoterId = viaResult?.ok ? viaResult?.shareLink?.promoter_id : null;
      if (promoterId) {
        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("id, display_name, avatar_url, headline, firm, is_profile_public")
          .eq("id", promoterId)
          .maybeSingle();
        if (profile) {
          promoterProfile = profile.is_profile_public === true
            ? profile
            : { id: profile.id, display_name: null, avatar_url: null, headline: null, firm: null };
        }
      }
    }

    // 4. Resolve primary contact with the 4-tier cascade
    const resolved = resolvePrimaryContact({
      eligibleContacts,
      viaAttribution: viaResult?.ok ? {
        promoterId: viaResult.attribution?.promoter_id,
        status: viaResult.viaStatus === VIA_STATUS.VALID ? "active" : "invalid",
        expiresAt: viaResult.attribution?.expires_at,
      } : cookieAttribution ? {
        promoterId: cookieAttribution.promoterId,
        expiresAt: cookieAttribution.expiresAt,
      } : null,
    });

    const response = NextResponse.json(
      {
        ok: true,
        propertyId,
        viaStatus: viaResult?.viaStatus || (cookieAttribution ? VIA_STATUS.VALID : null),
        routingReason: resolved.reason,
        primaryContact: resolved.contact,
        promoter: promoterProfile,
        otherContacts: resolved.otherContacts,
      },
      { headers: NO_STORE }
    );

    // 5. If promoter was valid, issue/refresh HTTP-only attribution cookie (30 days)
    if (requestedPromoter && (viaResult?.ok || !supabaseAdmin)) {
      const cookiePayload = serializeViaCookie({
        propertyId,
        promoterId: viaResult?.shareLink?.promoter_id || requestedPromoter,
        promoterSlug: requestedPromoter,
        promoterType: viaResult?.shareLink?.promoter_type || "broker",
        visitorId: visitorIdParam,
      });

      response.cookies.set(cookieName, cookiePayload, {
        maxAge: DEFAULT_VIA_ATTRIBUTION_DAYS * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (err) {
    console.error("[VIA API GET] Exception:", err);
    return NextResponse.json({ error: "VIA routing failed" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const rate = checkViaPostRate(clientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many routing decision requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { id: slug } = await params;
    if (!slug || !SAFE_ID.test(slug)) {
      return NextResponse.json({ error: "Invalid or missing property identifier" }, { status: 400 });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400, headers: NO_STORE });
    }
    const {
      visitorId = "anon",
      selectedContactId,
      selectedContactType = "broker",
      routingReason = ROUTING_REASONS.VIA_ATTRIBUTION,
      rankingSnapshot = [],
    } = body;

    if (!["owner", "broker"].includes(String(selectedContactType || "").toLowerCase())) {
      return NextResponse.json({ error: "Invalid selectedContactType" }, { status: 400, headers: NO_STORE });
    }
    if (!Object.values(ROUTING_REASONS).includes(routingReason)) {
      return NextResponse.json({ error: "Invalid routingReason" }, { status: 400, headers: NO_STORE });
    }

    let propertyId = slug;
    if (supabaseAdmin) {
      const isUuid = UUID_RE.test(slug);
      const query = supabaseAdmin.from("properties").select("id, lifecycle_state, pipeline_status");
      const { data } = await (isUuid
        ? query.eq("id", slug)
        : query.or(`canonical_slug.eq.${slug},slug.eq.${slug}`)
      ).maybeSingle();
      if (!data || normalizeLifecycleState(data) !== PROPERTY_LIFECYCLE_STATES.LIVE) {
        return NextResponse.json({ error: "Property not found" }, { status: 404, headers: NO_STORE });
      }
      propertyId = data.id;

      if (selectedContactId) {
        const routingResult = await getPropertyLeadRecipients(supabaseAdmin, propertyId);
        const recipients = Array.isArray(routingResult?.recipients) ? routingResult.recipients : [];
        const allowed = recipients.some(
          (r) => String(r.id || r.recipientId || r.broker_id || r.user_id || "") === String(selectedContactId)
        );
        if (!allowed) {
          return NextResponse.json({ error: "Selected contact is not eligible for this listing" }, { status: 403, headers: NO_STORE });
        }
      }

      await recordRoutingDecision(supabaseAdmin, {
        propertyId,
        visitorId: String(visitorId || "anon").slice(0, 64),
        selectedRecipientId: selectedContactId,
        selectedRecipientType: String(selectedContactType).toLowerCase(),
        routingReason,
        rankingSnapshot: Array.isArray(rankingSnapshot) ? rankingSnapshot.slice(0, 20) : [],
      });
    }

    return NextResponse.json({ ok: true, propertyId, routingReason }, { headers: NO_STORE });
  } catch (err) {
    console.error("[VIA API POST] Exception:", err);
    return NextResponse.json({ error: "Failed to record routing decision" }, { status: 500 });
  }
}
