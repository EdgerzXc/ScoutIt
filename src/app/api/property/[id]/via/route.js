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

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id: slug } = await params;
    if (!slug) return NextResponse.json({ error: "Missing property identifier" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const requestedPromoter = searchParams.get("promoter");
    const visitorIdParam = searchParams.get("visitor_id") || "anon_" + Math.random().toString(36).substring(2, 12);

    // 1. Resolve property from Supabase
    let property = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("properties")
        .select("id, title, slug, canonical_slug")
        .or(`canonical_slug.eq.${slug},slug.eq.${slug}`)
        .maybeSingle();
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

      // If valid or revoked, try to look up promoter details for UI
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name, avatar_url, headline, firm, is_profile_public")
        .eq("id", viaResult?.shareLink?.promoter_id || activePromoterSlug)
        .maybeSingle();

      promoterProfile = profile || {
        id: activePromoterSlug,
        display_name: activePromoterSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      };
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

    const response = NextResponse.json({
      ok: true,
      propertyId,
      viaStatus: viaResult?.viaStatus || (cookieAttribution ? VIA_STATUS.VALID : null),
      routingReason: resolved.reason,
      primaryContact: resolved.contact,
      promoter: promoterProfile,
      otherContacts: resolved.otherContacts,
    });

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
    const { id: slug } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      visitorId = "anon",
      selectedContactId,
      selectedContactType = "broker",
      routingReason = ROUTING_REASONS.VIA_ATTRIBUTION,
      rankingSnapshot = [],
    } = body;

    let propertyId = slug;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("properties")
        .select("id")
        .or(`canonical_slug.eq.${slug},slug.eq.${slug}`)
        .maybeSingle();
      if (data?.id) propertyId = data.id;

      await recordRoutingDecision(supabaseAdmin, {
        propertyId,
        visitorId,
        selectedRecipientId: selectedContactId,
        selectedRecipientType: selectedContactType,
        routingReason,
        rankingSnapshot,
      });
    }

    return NextResponse.json({ ok: true, propertyId, routingReason });
  } catch (err) {
    console.error("[VIA API POST] Exception:", err);
    return NextResponse.json({ error: "Failed to record routing decision" }, { status: 500 });
  }
}
