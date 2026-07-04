import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

// Soft-delete for the Owner dashboard's "Active Property Files" grid --
// there's no deleted_at/archived boolean on properties, so this reuses the
// existing pipeline_status column (currently: draft/pending/ai_drafting/
// approved) with a new 'archived' value, filtered out client-side the same
// way OwnerMode.js already filters myListings by ownerId.
//
// Scope note: this does NOT touch Airtable. An already-approved (publicly
// live) listing that gets archived here will keep showing on the public
// site until a separate unpublish-from-Airtable flow exists -- out of scope
// for this pass, which is about clearing clutter from the owner's own
// dashboard list, not unpublishing live listings.

const schema = z.object({
  propertyIds: z.array(z.string()).min(1).max(100),
  mockOwnerId: z.string().optional(),
});

export async function POST(request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { propertyIds, mockOwnerId } = parsed.data;

    const authHeader = request.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    let userId = null;
    if (token && token.trim() !== "") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await authClient.auth.getUser(token);
      if (!error && user) userId = user.id;
    }
    if (!userId && mockOwnerId === "master-dev") userId = "master-dev";
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // Only archive rows the caller actually owns -- selecting first instead
    // of trusting the client-sent id list against a blind .in() update.
    const { data: owned, error: ownedError } = await supabaseAdmin
      .from("properties")
      .select("id")
      .in("id", propertyIds)
      .eq("owner_id", userId);

    if (ownedError) {
      console.error("[ARCHIVE API] Failed to verify ownership:", ownedError);
      return NextResponse.json({ error: "Failed to verify ownership" }, { status: 500 });
    }

    const ownedIds = (owned || []).map((r) => r.id);
    if (ownedIds.length === 0) {
      return NextResponse.json({ error: "None of the selected properties belong to you" }, { status: 403 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("properties")
      .update({ pipeline_status: "archived" })
      .in("id", ownedIds);

    if (updateError) {
      console.error("[ARCHIVE API] Failed to archive:", updateError);
      return NextResponse.json({ error: "Failed to archive listings" }, { status: 500 });
    }

    return NextResponse.json({ success: true, archivedCount: ownedIds.length, archivedIds: ownedIds });
  } catch (err) {
    console.error("[ARCHIVE API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
