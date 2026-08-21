import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { pushBriefingToAirtable, publishedMarkers } from "@/lib/intelPublish";

// ⚠️ 🔴 UNAUTHENTICATED UNTIL 2026-08-06 (§59, full-system audit).
//
// Neither handler below checked anything, while both used the service-role
// client. The consequences, in order of severity:
//
//   1. `POST { action: "publish_briefing" }` inserted directly into
//      `intel_briefings`. `lib/cmsCache.js` reads that table into `/api/cms`,
//      which renders the PUBLIC `/intel` page and `/intel/[article-slug]` —
//      and Supabase briefings are merged with PRIORITY OVER AIRTABLE BY SLUG.
//      So any anonymous caller could publish an article under ScoutIt's name,
//      or overwrite an existing legitimate one by reusing its slug.
//   2. `POST { action: "manual_input" }` wrote arbitrary rows to `intel_sources`.
//   3. `GET` returned every source and briefing, including unpublished drafts.
//
// The path says `/api/admin/`, which is exactly why nobody looked: the name
// implied a gate that was never there. `src/proxy.js` matches `/api/:path*`
// but only does rate limiting, the kill switch and flags — it has NO admin
// check, so the middleware was not covering this either.
//
// Both handlers are now staff-gated via the shared `requireAdmin`.

// 1. GET /api/admin/osint — Fetch raw OSINT sources & staging briefings for Mission Control
export async function GET(req) {
  try {
    const gate = await requireAdmin(req, { label: "ADMIN OSINT" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const supabase = supabaseAdmin;

    // Fetch raw OSINT sources
    const { data: sources, error: sourcesErr } = await supabase
      .from("intel_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (sourcesErr) {
      console.warn("[OSINT API] Error reading intel_sources:", sourcesErr.message);
    }

    // Fetch published & staged briefings
    const { data: briefings, error: briefingsErr } = await supabase
      .from("intel_briefings")
      .select("*")
      .order("created_at", { ascending: false });

    if (briefingsErr) {
      console.warn("[OSINT API] Error reading intel_briefings:", briefingsErr.message);
    }

    return NextResponse.json({
      success: true,
      sources: sources || [],
      briefings: briefings || [],
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 2. POST /api/admin/osint — Generate 1-Click Master Prompt or Publish AI Output
export async function POST(req) {
  try {
    const gate = await requireAdmin(req, { label: "ADMIN OSINT" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await req.json();
    const { action } = body;
    const supabase = supabaseAdmin;

    // ACTION A: Manual Quick-Input Signal Entry from Mission Control
    if (action === "manual_input") {
      const { sourceName, sourceUrl, rawTitle, rawContent, city, region, lat, lng } = body;
      if (!rawTitle || !rawContent) {
        return NextResponse.json({ success: false, error: "Title and content required" }, { status: 400 });
      }

      const { data: newSource, error } = await supabase
        .from("intel_sources")
        .insert({
          source_name: sourceName || "Manual Mission Control Entry",
          source_url: sourceUrl || "",
          raw_title: rawTitle,
          raw_content: rawContent,
          city: city || "BGC, Taguig",
          region: region || "Metro Manila",
          lat: lat || 14.5547,
          lng: lng || 121.0244,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        source: newSource,
        message: "Raw OSINT signal added to Mission Control queue!",
      });
    }

    // ACTION B: Generate 1-Click Master AI Prompt for ChatGPT/Claude/Gemini
    if (action === "generate_prompt") {
      const { sourceIds } = body;
      if (!sourceIds || !sourceIds.length) {
        return NextResponse.json({ success: false, error: "No sourceIds provided" }, { status: 400 });
      }

      const { data: promptText, error } = await supabase.rpc("generate_osint_master_prompt", {
        source_ids: sourceIds,
      });

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        masterPrompt: promptText,
      });
    }

    // ACTION B: Publish Synthesized AI Briefing to Supabase & Airtable INTEL_CMS
    if (action === "publish_briefing") {
      const { briefingData, sourceId } = body;
      if (!briefingData || !briefingData.title || !briefingData.slug) {
        return NextResponse.json({ success: false, error: "Invalid briefing payload" }, { status: 400 });
      }

      // 1. Insert into Supabase intel_briefings
      const { data: inserted, error: subErr } = await supabase
        .from("intel_briefings")
        .insert({
          source_id: sourceId || null,
          slug: briefingData.slug,
          title: briefingData.title,
          category: briefingData.category || "MARKET INTEL",
          excerpt: briefingData.excerpt || "",
          lead: briefingData.lead || "",
          our_take: briefingData.our_take || "",
          cover_image_url: briefingData.cover_image_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop",
          body_json: briefingData.body_json || [],
          city: briefingData.city || "BGC, Taguig",
          region: briefingData.region || "Metro Manila",
          lat: briefingData.lat || 14.5547,
          lng: briefingData.lng || 121.0244,
          source_name: briefingData.sourceName || briefingData.source_name || "OSINT Gazette",
          source_url: briefingData.sourceUrl || briefingData.source_url || "",
          // ⚠️ NOT `published_to_airtable: true`. This used to be hardcoded
          // true here, at insert, while nothing in the codebase ever wrote to
          // Airtable and nothing ever read the column back — a column that
          // certified something that never happened (Standing Rule 7: a schema
          // must never manufacture a claim).
          //
          // The flag is now set in exactly one place: publishedMarkers() in
          // lib/intelPublish.js, which refuses to produce it without a real
          // Airtable record id. A briefing lands here as a DRAFT.
          published_to_airtable: false,
        })
        .select()
        .single();

      if (subErr) {
        console.warn("[OSINT API] Supabase Insert Error (Non-blocking):", subErr.message);
      }

      // 2. THE BRIDGE — Supabase draft → Airtable INTEL_CMS.
      //
      // This is the step the schema was built for and never had. Until now,
      // `published_to_airtable` was set true at insert while nothing ever
      // wrote to Airtable, and `lib/intelPublish.js` had no caller at all —
      // an endpoint with no caller is a plan, not a feature (Standing Rule 13).
      //
      // Deliberately NON-FATAL. The Supabase row is already committed and is
      // the draft of record; losing the Airtable hop is a sync problem, not a
      // lost article. But it is reported honestly rather than swallowed —
      // the operator must be able to tell "in Airtable" from "not in Airtable",
      // which is precisely what the old hardcoded `true` made impossible.
      let airtableStatus = "skipped";
      let airtableRecordId = null;

      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;

      if (inserted && apiKey && baseId) {
        try {
          const { recordId } = await pushBriefingToAirtable({
            apiKey,
            baseId,
            briefing: inserted,
            relatedPropertyIds: Array.isArray(briefingData.relatedPropertyIds)
              ? briefingData.relatedPropertyIds
              : [],
          });

          // Markers are written ONLY here, only with a real record id.
          await supabase
            .from("intel_briefings")
            .update(publishedMarkers(recordId))
            .eq("id", inserted.id);

          airtableRecordId = recordId;
          airtableStatus = "published";
        } catch (bridgeErr) {
          console.error("[OSINT API] Airtable bridge failed:", bridgeErr?.message);
          airtableStatus = "failed";
        }
      } else if (!apiKey || !baseId) {
        airtableStatus = "unconfigured";
      }

      // 3. Update status on raw source row
      if (sourceId) {
        await supabase
          .from("intel_sources")
          .update({ status: "published", updated_at: new Date().toISOString() })
          .eq("id", sourceId);
      }

      return NextResponse.json({
        success: true,
        briefing: inserted || briefingData,
        airtable: { status: airtableStatus, recordId: airtableRecordId },
        // The message names what actually happened. "Published" previously
        // meant "a Supabase row exists", which is not what a reader of that
        // word assumes.
        message:
          airtableStatus === "published"
            ? "Draft saved and synced to Airtable. Tick Approved_For_Live_Site there to put it on the public site."
            : airtableStatus === "failed"
              ? "Draft saved to Supabase, but the Airtable sync failed. The article is not in the CMS yet."
              : "Draft saved to Supabase. Airtable is not configured, so it was not synced.",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
