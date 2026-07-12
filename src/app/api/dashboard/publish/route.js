import { NextResponse } from "next/server";
import { insertProperty, updateProperty } from "@/lib/airtable";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {

  try {
    // 1. Extract token from Authorization header to prevent identity spoofing
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const { submissionId } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Validate session server-side
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    let userId = user.id;

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // 2. Fetch the submission using Admin client and verify ownership
    const { data: currentSubmission, error: fetchError } = await supabaseAdmin
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

    // 3. Sync to Airtable (Idempotent Upsert)
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (apiKey && baseId) {
      try {
        console.log(`[PUBLISH API] Syncing slug ${currentSubmission.slug} to Airtable...`);
        const payload = {
          title: currentSubmission.title,
          slug: currentSubmission.slug,
          location: currentSubmission.location,
          type: currentSubmission.type,
          space_category: currentSubmission.space_category,
          details: currentSubmission.details || {}
        };
        
        let finalSlug = currentSubmission.slug;

        // Attempt update first, fallback to insert. Airtable's Slug is a
        // FORMULA field (computed from Title) — the app-side slug can drift
        // from it (e.g. "E-Com" slugifies differently on each side, the exact
        // cause of the one-ecom-center Contact-flow break). Both paths read
        // Airtable's computed Slug back and persist it to Supabase below, so
        // Airtable stays the single source of slug truth on every publish.
        try {
          // If update succeeds, the record existed
          const updated = await updateProperty(apiKey, baseId, currentSubmission.slug, payload);
          finalSlug = updated?.fields?.Slug || currentSubmission.slug;
        } catch (updateErr) {
          // Record doesn't exist, insert instead
          const created = await insertProperty(apiKey, baseId, payload);
          finalSlug = created?.fields?.Slug || currentSubmission.slug;
        }

        // 4. Update Supabase only AFTER Airtable success
        const { error: updateError } = await supabaseAdmin
          .from('properties')
          .update({ pipeline_status: 'approved', slug: finalSlug })
          .eq('id', submissionId);

        if (updateError) {
          console.error("[PUBLISH API] Failed to approve in Supabase:", updateError);
          return NextResponse.json({ error: "Failed to update database status" }, { status: 500 });
        }

      } catch (airtableErr) {
        console.error("[PUBLISH API] Airtable sync failed:", airtableErr);
        return NextResponse.json({ error: "Airtable sync failed: " + airtableErr.message }, { status: 500 });
      }
    } else {
      console.warn("[PUBLISH API] Airtable credentials missing, approving locally only.");
      await supabaseAdmin.from('properties').update({ pipeline_status: 'approved' }).eq('id', submissionId);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[PUBLISH API] Error during publish process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
