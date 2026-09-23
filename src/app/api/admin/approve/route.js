import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { insertProperty } from "@/lib/airtable";
import { sanitizeError } from "@/lib/sanitizeError";

export async function POST(request) {
  try {
    const authResult = await requireAdmin(request, { label: "ADMIN APPROVE" });
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.userId;

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
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("[ADMIN API] Failed to fetch submission:", fetchError);
      return NextResponse.json({ error: "Submission not found or error fetching" }, { status: 404 });
    }

    // 2. Insert into Airtable
    const airtableRecord = await insertProperty(apiKey, baseId, submission);

    // 3. Update Supabase status to 'approved'. Airtable's Slug is a FORMULA
    // field and the single source of slug truth (same rule the owner publish
    // path follows on both its paths): persist the computed Slug back, and
    // adopt it as canonical_slug only when none is owner-locked yet.
    const airtableSlug = airtableRecord?.fields?.Slug || null;
    const slugUpdate = airtableSlug
      ? {
          slug: airtableSlug,
          ...(submission.canonical_slug ? {} : { canonical_slug: airtableSlug }),
        }
      : {};
    const { error: updateError } = await supabaseAdmin
      .from('properties')
      .update({ pipeline_status: 'approved', ...slugUpdate })
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
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
