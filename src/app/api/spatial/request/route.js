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
    const { propertyId, stylePreset, fileUrl, notes } = body;

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

    let currentConnects = 0;
    if (supabaseAdmin) {
      const { data: wallet } = await supabaseAdmin
        .from("user_connect_wallets")
        .select("granted_balance, purchased_balance, reward_balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (wallet) {
        currentConnects = (wallet.granted_balance || 0) + (wallet.purchased_balance || 0) + (wallet.reward_balance || 0);
      }
    }

    const result = await submitSpatialGenerationRequest({
      supabaseClient: supabaseAdmin,
      user: { id: userId },
      propertyId,
      stylePreset,
      fileUrl,
      notes,
      currentTier: tier,
      currentConnects,
    });

    if (!result.success) {
      const status =
        result.code === "insufficient_entitlement"
          ? 402
          : result.code === "forbidden"
          ? 403
          : result.code === "not_found"
          ? 404
          : 400;
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
