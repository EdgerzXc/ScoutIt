import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { insertProperty } from "@/lib/airtable";

export async function POST(request) {
  try {
    const { submissionId, userId } = await request.json();

    if (!submissionId || !userId) {
      return NextResponse.json({ error: "Missing submissionId or userId" }, { status: 400 });
    }

    // 1. Fetch the submission and verify ownership
    const { data: currentSubmission, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !currentSubmission) {
      console.error("[PUBLISH API] Failed to fetch submission:", fetchError);
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (currentSubmission.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    if (currentSubmission.pipeline_status === 'approved') {
      return NextResponse.json({ error: "Property is already published" }, { status: 400 });
    }

    // 2. Update Supabase pipeline_status
    const { error: updateError } = await supabase
      .from('properties')
      .update({ pipeline_status: 'approved' })
      .eq('id', submissionId);

    if (updateError) {
      console.error("[PUBLISH API] Failed to approve in Supabase:", updateError);
      return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
    }

    // 3. Sync to Airtable (Insert as a new active property)
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (apiKey && baseId) {
      try {
        console.log(`[PUBLISH API] Publishing slug ${currentSubmission.slug} to Airtable...`);
        // Format payload for insertProperty
        const payload = {
          title: currentSubmission.title,
          slug: currentSubmission.slug,
          location: currentSubmission.location,
          type: currentSubmission.type,
          space_category: currentSubmission.space_category,
          details: currentSubmission.details || {}
        };
        const created = await insertProperty(apiKey, baseId, payload);
        // insertProperty generates/guarantees the slug — mirror it back to Supabase
        // so the owner's editor shows and can share the real public URL.
        const finalSlug = created?.fields?.Slug;
        if (finalSlug && finalSlug !== currentSubmission.slug) {
          await supabase
            .from('properties')
            .update({ slug: finalSlug })
            .eq('id', submissionId);
        }
      } catch (airtableErr) {
        console.error("[PUBLISH API] Airtable insert failed:", airtableErr);
        // It failed in Airtable, so we should maybe revert the status, but since we're using "sync engine",
        // we'll return a warning. In a robust system, this would be queued or transactional.
        return NextResponse.json({ 
          success: true, 
          warning: "Published in Supabase, but Airtable sync failed: " + airtableErr.message 
        });
      }
    } else {
      console.warn("[PUBLISH API] Airtable credentials missing, skipping sync.");
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[PUBLISH API] Error during publish process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
