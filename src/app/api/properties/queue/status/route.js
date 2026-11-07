import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { calculateQueuePosition } from "@/lib/queuePosition";

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration missing: supabaseAdmin is not available." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") || searchParams.get("id");

    if (!propertyId) {
      return NextResponse.json({ error: "Missing propertyId parameter." }, { status: 400 });
    }

    const { data: property, error: fetchError } = await supabaseAdmin
      .from("properties")
      .select("id, owner_id, title, location, type, space_category, price, pipeline_status, created_at, details")
      .eq("id", propertyId)
      .maybeSingle();

    if (fetchError || !property) {
      return NextResponse.json({ error: "Property listing not found." }, { status: 404 });
    }

    // Owner check: Ensure caller owns the listing
    if (property.owner_id !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this listing." }, { status: 403 });
    }

    if (property.pipeline_status !== "ai_drafting") {
      return NextResponse.json({
        isDone: true,
        pipelineStatus: property.pipeline_status,
        property,
      });
    }

    // Still in queue: Calculate current queue position deterministically
    const queueNumber = await calculateQueuePosition(supabaseAdmin, property.id);

    return NextResponse.json({
      isDone: false,
      pipelineStatus: "ai_drafting",
      queueNumber,
      queuedAt: property.details?.queued_at || property.created_at,
      title: property.title,
    });
  } catch (err) {
    console.error("[queue-status] Unexpected error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not check queue status.") },
      { status: 500 }
    );
  }
}
