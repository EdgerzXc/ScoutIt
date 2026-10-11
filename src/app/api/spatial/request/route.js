import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId, resolveServerTier } from "@/lib/serverAuth";
import { submitSpatialGenerationRequest } from "@/lib/serverSpatialStudio";

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
    const { propertyId, stylePreset, fileUrl, notes, walletConnects = 0 } = body;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "propertyId is required", code: "missing_property" },
        { status: 400 }
      );
    }

    if (!stylePreset) {
      return NextResponse.json(
        { success: false, error: "stylePreset is required", code: "missing_style_preset" },
        { status: 400 }
      );
    }

    const { tier } = await resolveServerTier(request);

    const result = await submitSpatialGenerationRequest({
      supabaseClient: supabaseAdmin,
      user: { id: userId },
      propertyId,
      stylePreset,
      fileUrl,
      notes,
      currentTier: tier,
      currentConnects: Number(walletConnects) || 0,
    });

    if (!result.success) {
      const status = result.code === "insufficient_entitlement" ? 402 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[spatial request POST]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "server_error" },
      { status: 500 }
    );
  }
}
