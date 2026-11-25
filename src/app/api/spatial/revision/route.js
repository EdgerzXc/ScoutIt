import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { submitSpatialRevisionRequest } from "@/lib/serverSpatialStudio";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { stripAllTags } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export const checkSpatialRevisionRate = createRateLimiter({
  limit: 15,
  windowMs: 60_000,
  maxKeys: 10_000,
});

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "unauthenticated" },
        { status: 401 }
      );
    }

    const rate = checkSpatialRevisionRate(clientIp(request) + ":" + userId);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many revision requests. Please try again shortly.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { propertyId, revisionNotes, targetElements = [] } = body;

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json(
        { success: false, error: "propertyId is required", code: "missing_property" },
        { status: 400 }
      );
    }

    if (!revisionNotes || typeof revisionNotes !== "string" || revisionNotes.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Detailed revision notes (at least 5 characters) are required",
          code: "invalid_revision_notes",
        },
        { status: 400 }
      );
    }

    const safeRevisionNotes = stripAllTags(revisionNotes.trim().slice(0, 2000));
    const safeTargetElements = Array.isArray(targetElements)
      ? targetElements.slice(0, 20).filter((e) => typeof e === "string").map((e) => stripAllTags(e.slice(0, 100)))
      : [];

    const result = await submitSpatialRevisionRequest({
      supabaseClient: supabaseAdmin,
      user: { id: userId },
      propertyId,
      revisionNotes: safeRevisionNotes,
      targetElements: safeTargetElements,
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
