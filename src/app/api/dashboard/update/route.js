import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateProperty } from "@/lib/airtable";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const updateSchema = z.object({
  title: z.string().max(255).optional(),
  type: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  details: z.record(z.any()).optional()
});

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const userId = user.id;

    const { submissionId, data } = await request.json();

    if (!submissionId || !data) {
      return NextResponse.json({ error: "Missing submissionId or data" }, { status: 400 });
    }

    const validationResult = updateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // 1. Fetch the current submission to check its status and get its slug
    const { data: currentSubmission, error: fetchError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !currentSubmission) {
      console.error("[UPDATE API] Failed to fetch submission:", fetchError);
      return NextResponse.json({ error: "Submission not found or error fetching" }, { status: 404 });
    }

    if (currentSubmission.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    // Format the payload for Supabase, sanitizing string inputs
    const supabasePayload = {
      title: validatedData.title ? DOMPurify.sanitize(validatedData.title) : currentSubmission.title,
      type: validatedData.type ? DOMPurify.sanitize(validatedData.type) : currentSubmission.type,
      location: validatedData.location ? DOMPurify.sanitize(validatedData.location) : currentSubmission.location
    };

    // Merge details JSONB safely
    if (validatedData.details) {
      // In a real strict environment, we'd recursively sanitize or strictly validate `details`. 
      // Assuming details is a flat object of strings for now.
      const sanitizedDetails = {};
      for (const [key, val] of Object.entries(validatedData.details)) {
        sanitizedDetails[DOMPurify.sanitize(key)] = typeof val === 'string' ? DOMPurify.sanitize(val) : val;
      }

      supabasePayload.details = {
        ...(currentSubmission.details || {}),
        ...sanitizedDetails
      };
    }

    // 2. Update Supabase
    const { error: updateError } = await supabaseAdmin
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
