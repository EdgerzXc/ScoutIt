import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSpatialPropertyStatus } from "@/lib/serverSpatialStudio";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id") || searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "property_id is required", code: "missing_property" },
        { status: 400 }
      );
    }

    const statusData = await getSpatialPropertyStatus({
      supabaseClient: supabaseAdmin,
      propertyId,
    });

    return NextResponse.json(
      { success: true, ...statusData },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[spatial status GET]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "server_error" },
      { status: 500 }
    );
  }
}
