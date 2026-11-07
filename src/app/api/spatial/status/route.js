import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { findProperty } from "@/lib/propertyLookup";
import { getSpatialPropertyStatus } from "@/lib/serverSpatialStudio";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id") || searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "property_id is required", code: "missing_property" },
        { status: 400 }
      );
    }

    const { property } = await findProperty(supabaseAdmin, propertyId, ["id", "owner_id"]);

    // Same 404 for "missing" and "not yours" so the route is not an existence oracle.
    const notFound = () =>
      NextResponse.json(
        { success: false, error: "Property not found", code: "not_found" },
        { status: 404 }
      );

    if (!property) return notFound();

    if (!property.owner_id || property.owner_id !== userId) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("role, active_roles")
        .eq("id", userId)
        .maybeSingle();
      const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
      const isStaff =
        profile?.role === "admin" ||
        profile?.role === "staff" ||
        roles.includes("admin") ||
        roles.includes("staff");
      if (!isStaff) return notFound();
    }

    const statusData = await getSpatialPropertyStatus({
      supabaseClient: supabaseAdmin,
      propertyId: property.id,
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
