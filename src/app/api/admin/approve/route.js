import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { insertProperty } from "@/lib/airtable";

export async function POST(request) {
  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
      return NextResponse.json({ error: "Airtable configuration missing" }, { status: 500 });
    }

    // 1. Fetch the submission from Supabase
    const { data: submission, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("[ADMIN API] Failed to fetch submission:", fetchError);
      return NextResponse.json({ error: "Submission not found or error fetching" }, { status: 404 });
    }

    // 2. Insert into Airtable
    console.log(`[ADMIN API] Syncing ${submissionId} to Airtable...`);
    const airtableRecord = await insertProperty(apiKey, baseId, submission);

    // 3. Update Supabase status to 'approved'
    const { error: updateError } = await supabase
      .from('properties')
      .update({ pipeline_status: 'approved' })
      .eq('id', submissionId);

    if (updateError) {
      console.error("[ADMIN API] Failed to update Supabase status:", updateError);
      // We still return 200 because it made it to Airtable, but we flag it
      return NextResponse.json({ 
        success: true, 
        warning: "Inserted to Airtable but failed to update Supabase status",
        airtableId: airtableRecord.id 
      });
    }

    return NextResponse.json({ success: true, airtableId: airtableRecord.id });

  } catch (err) {
    console.error("[ADMIN API] Error during approval process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
