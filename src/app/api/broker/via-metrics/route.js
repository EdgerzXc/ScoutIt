import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { aggregateBrokerViaMetrics } from "@/lib/viaTelemetry";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) => NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    if (!supabaseAdmin) {
      return json({ ok: false, reason: "service_unavailable" }, 503);
    }

    // 1. Fetch broker's share links
    const { data: shareLinks, error: linksError } = await supabaseAdmin
      .from("via_share_links")
      .select("id, property_id, slug, status, clicks_count, created_at")
      .eq("promoter_id", userId);

    if (linksError) {
      console.warn("[viaMetrics] via_share_links lookup skipped or unmigrated:", linksError.message);
      // Return empty zero-state rather than failing
      const emptyMetrics = aggregateBrokerViaMetrics();
      return json({
        ok: true,
        summary: emptyMetrics.funnel,
        conversionRates: emptyMetrics.conversionRates,
        antiAbuse: emptyMetrics.antiAbuse,
        behavioralFeedback: emptyMetrics.behavioralFeedback,
        propertyBreakdown: [],
        shareLinks: [],
      });
    }

    // 2. Fetch attributions for this promoter
    const { data: attributions } = await supabaseAdmin
      .from("via_attributions")
      .select("id, property_id, visitor_id, is_qualified, status, first_seen_at, expires_at")
      .eq("promoter_id", userId);

    // 3. Fetch routing decisions where this broker was prioritized
    const { data: routingDecisions } = await supabaseAdmin
      .from("via_routing_decisions")
      .select("id, property_id, visitor_id, routing_reason, created_at")
      .eq("selected_recipient_id", userId);

    // 4. Fetch deals linked to this broker
    const { data: deals } = await supabaseAdmin
      .from("deals")
      .select("id, property_id, status, stage, created_at")
      .eq("broker_id", userId);

    // 5. Aggregate overall metrics
    const metrics = aggregateBrokerViaMetrics({
      attributions: attributions || [],
      routingDecisions: routingDecisions || [],
      deals: deals || [],
    });

    // 6. Calculate property-level breakdown
    const propMap = new Map();
    for (const link of shareLinks || []) {
      if (!propMap.has(link.property_id)) {
        propMap.set(link.property_id, {
          propertyId: link.property_id,
          shareSlug: link.slug,
          clicks: Number(link.clicks_count) || 0,
          qualifiedVisits: 0,
          inquiries: 0,
          deals: 0,
        });
      }
    }

    for (const attr of attributions || []) {
      const entry = propMap.get(attr.property_id);
      if (entry && attr.is_qualified) {
        entry.qualifiedVisits++;
      }
    }

    for (const decision of routingDecisions || []) {
      if (decision.routing_reason === "VIA_ATTRIBUTION") {
        const entry = propMap.get(decision.property_id);
        if (entry) {
          entry.inquiries++;
        }
      }
    }

    for (const d of deals || []) {
      const entry = propMap.get(d.property_id);
      if (entry && (d.stage === "closed" || d.status === "completed")) {
        entry.deals++;
      }
    }

    return json({
      ok: true,
      summary: metrics.funnel,
      conversionRates: metrics.conversionRates,
      antiAbuse: metrics.antiAbuse,
      behavioralFeedback: metrics.behavioralFeedback,
      propertyBreakdown: Array.from(propMap.values()),
      shareLinks: shareLinks || [],
    });
  } catch (err) {
    console.error("[viaMetrics] Exception:", err);
    return json({ ok: false, error: "Internal error loading VIA metrics" }, 500);
  }
}
