import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { submitSpatialRevisionRequest } from "@/lib/serverSpatialStudio";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { propertyId, revisionNotes, targetElements = [] } = body;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "propertyId is required", code: "missing_property" },
        { status: 400 }
      );
    }

    if (!revisionNotes || revisionNotes.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Detailed revision notes (at least 5 characters) are required",
          code: "invalid_revision_notes",
        },
        { status: 400 }
      );
    }

    const result = await submitSpatialRevisionRequest({
      supabaseClient: supabaseAdmin,
      user: { id: userId },
      propertyId,
      revisionNotes,
      targetElements,
    });

    if (!result.success) {
      const status = result.code === "forbidden" ? 403 : result.code === "not_found" ? 404 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[spatial revision POST]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "server_error" },
      { status: 500 }
    );
  }
}
