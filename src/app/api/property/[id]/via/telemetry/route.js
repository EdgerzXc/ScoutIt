import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { clientIp } from "@/lib/clientIp";
import {
  evaluateAntiAbuse,
  evaluateVisitQualification,
  recordQualifiedVisitTelemetry,
} from "@/lib/viaTelemetry";
import { getViaCookieName, parseViaCookie } from "@/lib/viaRouting";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const { id: slug } = await params;
    if (!slug) {
      return NextResponse.json({ ok: false, error: "Missing property identifier" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      visitorId = "anon",
      promoterSlug = null,
      dwellTimeSeconds = 0,
      scrollDepthPercent = 0,
      interactedWithUnits = false,
      interactedWithMedia = false,
      usedTools = false,
      openedInquiry = false,
      returnedVisit = false,
    } = body;

    const userAgent = request.headers.get("user-agent") || "";
    const ip = clientIp(request) || "";
    let authenticatedUserId = null;
    try {
      authenticatedUserId = await resolveUserId(request);
    } catch {}

    // 1. Resolve property from Supabase
    let propertyId = slug;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("properties")
        .select("id")
        .or(`canonical_slug.eq.${slug},slug.eq.${slug}`)
        .maybeSingle();
      if (data?.id) propertyId = data.id;
    }

    // 2. Read attribution cookie if promoter slug was not passed explicitly
    const cookieName = getViaCookieName(propertyId);
    const cookieValue = request.cookies?.get ? request.cookies.get(cookieName)?.value : null;
    const cookieAttr = parseViaCookie(cookieValue);
    const resolvedPromoterSlug = promoterSlug || cookieAttr?.promoterSlug || null;
    const resolvedPromoterId = cookieAttr?.promoterId || null;

    // 3. Evaluate Anti-Abuse
    const antiAbuseResult = evaluateAntiAbuse({
      userAgent,
      ipAddress: ip,
      visitorId,
      visitorUserId: authenticatedUserId,
      promoterId: resolvedPromoterId,
      promoterSlug: resolvedPromoterSlug,
    });

    // 4. Evaluate Visit Qualification
    const qualificationResult = evaluateVisitQualification({
      dwellTimeSeconds: Number(dwellTimeSeconds) || 0,
      scrollDepthPercent: Number(scrollDepthPercent) || 0,
      interactedWithUnits: Boolean(interactedWithUnits),
      interactedWithMedia: Boolean(interactedWithMedia),
      usedTools: Boolean(usedTools),
      openedInquiry: Boolean(openedInquiry),
      returnedVisit: Boolean(returnedVisit),
      antiAbuseResult,
    });

    // 5. If qualified, persist status in Supabase via_attributions
    if (qualificationResult.isQualified && supabaseAdmin) {
      await recordQualifiedVisitTelemetry(supabaseAdmin, {
        propertyId,
        visitorId,
        qualificationResult,
      });
    }

    return NextResponse.json({
      ok: true,
      propertyId,
      isQualified: qualificationResult.isQualified,
      qualificationScore: qualificationResult.qualificationScore,
      reasons: qualificationResult.reasons,
      disqualificationFlags: qualificationResult.disqualificationFlags,
    });
  } catch (err) {
    console.error("[VIA Telemetry Route] Exception:", err);
    // Never fail public telemetry with fatal errors
    return NextResponse.json({ ok: false, error: "Telemetry evaluation failed" }, { status: 500 });
  }
}
