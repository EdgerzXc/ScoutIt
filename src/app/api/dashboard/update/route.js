import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { updateProperty } from "@/lib/airtable";

export async function POST(request) {
  try {
    const { submissionId, data } = await request.json();

    if (!submissionId || !data) {
      return NextResponse.json({ error: "Missing submissionId or data" }, { status: 400 });
    }

    // 1. Fetch the current submission to check its status and get its slug
    const { data: currentSubmission, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !currentSubmission) {
      console.error("[UPDATE API] Failed to fetch submission:", fetchError);
      return NextResponse.json({ error: "Submission not found or error fetching" }, { status: 404 });
    }

    // Format the payload for Supabase
    const supabasePayload = {
      title: data.title || currentSubmission.title,
      type: data.type || currentSubmission.type,
      location: data.location || currentSubmission.location
    };

    // Merge details JSONB safely
    if (data.details) {
      supabasePayload.details = {
        ...(currentSubmission.details || {}),
        ...data.details
      };
    }

    // 2. Update Supabase
    const { error: updateError } = await supabase
      .from('properties')
      .update(supabasePayload)
      .eq('id', submissionId);

    if (updateError) {
      console.error("[UPDATE API] Failed to update Supabase:", updateError);
      return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
    }

    // 3. If approved, update Airtable too!
    if (currentSubmission.pipeline_status === 'approved') {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;

      if (apiKey && baseId) {
        // The slug is derived from the original title
        const slug = currentSubmission.slug || currentSubmission.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        try {
          console.log(`[UPDATE API] Syncing updates for slug ${slug} to Airtable...`);
          await updateProperty(apiKey, baseId, slug, supabasePayload);
        } catch (airtableErr) {
          console.error("[UPDATE API] Airtable update failed:", airtableErr);
          // Return success but with a warning, as Supabase succeeded
          return NextResponse.json({ 
            success: true, 
            warning: "Supabase updated, but Airtable sync failed: " + airtableErr.message 
          });
        }
      } else {
        console.warn("[UPDATE API] Airtable credentials missing, skipping sync.");
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[UPDATE API] Error during update process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
