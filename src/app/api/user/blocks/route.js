import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { addBlock, removeBlock, listBlocks } from "@/lib/connectBlocks";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * GET /api/user/blocks
 * Returns the list of users blocked by the authenticated caller.
 */
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const blocks = await listBlocks(supabaseAdmin, userId);
    return NextResponse.json({ success: true, blocks });
  } catch (err) {
    console.error("[USER BLOCKS API] GET error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to load blocked accounts.") },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/blocks
 * Adds a block for target blockedId.
 */
export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const blockedId = typeof body.blockedId === "string" ? body.blockedId.trim() : null;

    if (!blockedId) {
      return NextResponse.json(
        { error: "Missing blockedId: target account required." },
        { status: 400 }
      );
    }

    if (blockedId === userId) {
      return NextResponse.json(
        { error: "Cannot block your own account." },
        { status: 400 }
      );
    }

    const res = await addBlock(supabaseAdmin, userId, blockedId);
    if (!res.ok) {
      return NextResponse.json(
        { error: res.error || "Failed to block account." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User blocked successfully. They cannot initiate or pitch to you.",
    });
  } catch (err) {
    console.error("[USER BLOCKS API] POST error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to block account.") },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/blocks
 * Removes a block for target blockedId.
 */
export async function DELETE(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    let blockedId = null;
    try {
      const url = new URL(request.url);
      blockedId = url.searchParams.get("blockedId");
    } catch {
      // fallback
    }

    if (!blockedId) {
      const body = await request.json().catch(() => ({}));
      blockedId = typeof body.blockedId === "string" ? body.blockedId.trim() : null;
    }

    if (!blockedId) {
      return NextResponse.json(
        { error: "Missing blockedId: target account required." },
        { status: 400 }
      );
    }

    const res = await removeBlock(supabaseAdmin, userId, blockedId);
    if (!res.ok) {
      return NextResponse.json(
        { error: res.error || "Failed to unblock account." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User unblocked successfully.",
    });
  } catch (err) {
    console.error("[USER BLOCKS API] DELETE error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to unblock account.") },
      { status: 500 }
    );
  }
}
