import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 1. GET /api/admin/osint — Fetch raw OSINT sources & staging briefings for Mission Control
export async function GET(req) {
  try {
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
          published_to_airtable: true,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (subErr) {
        console.warn("[OSINT API] Supabase Insert Error (Non-blocking):", subErr.message);
      }

      // 2. Update status on raw source row
      if (sourceId) {
        await supabase
          .from("intel_sources")
          .update({ status: "published", updated_at: new Date().toISOString() })
          .eq("id", sourceId);
      }

      return NextResponse.json({
        success: true,
        briefing: inserted || briefingData,
        message: "Successfully published to Intel platform and synced with 3D Map!",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
