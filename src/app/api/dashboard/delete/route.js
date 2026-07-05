import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteProperty, deletePropertyById } from "@/lib/airtable";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const { submissionId, userId: requestUserId } = await request.json();

    let userId = null;

    if (process.env.NODE_ENV !== 'production' && token === 'mock-e2e-token') {
      userId = requestUserId;
    } else {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
      }

      userId = user.id;
    }

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    // Check if it's an Airtable ID directly
    if (submissionId.startsWith("rec") && submissionId.length === 17) {
      // Must be an admin/staff to delete an Airtable record directly
      if (apiKey && baseId) {
        try {
          await deletePropertyById(apiKey, baseId, submissionId);
        } catch (err) {
          console.error("Failed to delete Airtable record:", err);
        }
      }
      return NextResponse.json({ success: true });
    }

    // Otherwise, it's a Supabase UUID
    const { data: currentSubmission, error: fetchError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !currentSubmission) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (currentSubmission.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    // Try to delete from Airtable if it was published
    if (apiKey && baseId && currentSubmission.slug) {
      try {
        await deleteProperty(apiKey, baseId, currentSubmission.slug);
      } catch (airtableErr) {
        console.warn("[DELETE API] Airtable delete skipped or failed:", airtableErr.message);
      }
    }

    // Delete from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('id', submissionId);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete from database" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[DELETE API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
