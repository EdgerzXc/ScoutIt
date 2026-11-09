import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import {
  BADGE_DEFINITIONS,
  isPioneerBadge,
  hasAnyPioneerBadge,
  formatCharterSeatLabel,
} from "@/lib/BadgeEngine";

const REQUIRED_ROLES = {
  PIONEER_BROKER: ["broker"],
  PIONEER_OWNER: ["owner"],
  PIONEER_CREATOR: ["provider", "photographer", "designer", "researcher", "creator"],
};

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const { badgeId } = await request.json();

    if (!badgeId) {
      return NextResponse.json({ error: "Missing badgeId" }, { status: 400 });
    }

    const badgeDef = BADGE_DEFINITIONS[badgeId];
    if (!badgeDef) {
      return NextResponse.json({ error: "Unknown badge" }, { status: 400 });
    }
    if (!badgeId.startsWith("PIONEER_")) {
      return NextResponse.json({ error: "This badge cannot be self-claimed" }, { status: 403 });
    }

    const required = REQUIRED_ROLES[badgeId];
    if (required) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("role, active_roles")
        .eq("id", userId)
        .maybeSingle();
      const userRoles = new Set(
        [profile?.role, ...(Array.isArray(profile?.active_roles) ? profile.active_roles : [])]
          .filter(Boolean)
          .map((r) => String(r).toLowerCase())
      );
      if (!required.some((r) => userRoles.has(r))) {
        return NextResponse.json({ error: `Requires ${required[0]} role` }, { status: 403 });
      }
    }

    // Strict Mutual Exclusivity: Verify account does not already hold another Pioneer Charter
    if (isPioneerBadge(badgeId)) {
      const { data: existingUserBadges } = await supabaseAdmin
        .from("user_badges")
        .select("badge_id, seat_number")
        .eq("user_id", userId);
      if (hasAnyPioneerBadge(existingUserBadges)) {
        return NextResponse.json(
          { error: "Account already holds a Pioneer Charter. Pioneer seats are strictly limited to one badge per account." },
          { status: 409 }
        );
      }
    }

    // GAP-27: Prevent TOCTOU badge over-minting via atomic PostgreSQL RPC mint_pioneer_badge_atomic
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("mint_pioneer_badge_atomic", {
      p_user_id: userId,
      p_badge_id: badgeId,
      p_max_slots: badgeDef.max_slots,
    });

    let newBadge = null;

    if (!rpcError && rpcResult && rpcResult.length > 0) {
      const outcome = rpcResult[0];
      if (!outcome.success) {
        if (outcome.error_code === "ALREADY_CLAIMED") {
          return NextResponse.json({ error: "Badge already claimed" }, { status: 400 });
        }
        if (outcome.error_code === "ONE_PIONEER_PER_ACCOUNT") {
          return NextResponse.json(
            { error: "Account already holds a Pioneer Charter. Pioneer seats are strictly limited to one badge per account." },
            { status: 409 }
          );
        }
        if (outcome.error_code === "SOLD_OUT") {
          return NextResponse.json({ error: "This cohort is sold out" }, { status: 409 });
        }
        if (outcome.error_code === "UNAUTHORIZED") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Failed to mint badge" }, { status: 500 });
      }
      newBadge = outcome.badge_record;
    } else {
      // Fallback if RPC is not yet applied in environment
      if (rpcError && rpcError.code !== "PGRST202" && rpcError.code !== "42883") {
        console.error("[CLAIM API] RPC error during mint:", rpcError);
      }

      // Enforce real scarcity server-side — count actual claims, not the hardcoded display number.
      const { count: claimedCount, error: countError } = await supabaseAdmin
        .from("user_badges")
        .select("id", { count: "exact", head: true })
        .eq("badge_id", badgeId);

      if (countError) {
        console.error("[CLAIM API] Failed to count existing claims:", countError);
        return NextResponse.json({ error: "Failed to verify badge availability" }, { status: 500 });
      }
      if ((claimedCount || 0) >= badgeDef.max_slots) {
        return NextResponse.json({ error: "This cohort is sold out" }, { status: 409 });
      }

      const assignedSeat = (claimedCount || 0) + 1;

      // Insert the claim — unique(user_id, badge_id) rejects a duplicate claim at the DB level.
      const { data: insertedBadge, error: insertError } = await supabaseAdmin
        .from("user_badges")
        .insert({
          user_id: userId,
          badge_id: badgeId,
          granted_by: "self_claim",
          seat_number: assignedSeat,
          is_transferable: true,
          transfer_locked_until: new Date(Date.now() + 180 * 86400 * 1000).toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return NextResponse.json({ error: "Badge already claimed" }, { status: 400 });
        }
        console.error("[CLAIM API] Failed to insert badge claim:", insertError);
        return NextResponse.json({ error: "Failed to mint badge" }, { status: 500 });
      }
      newBadge = insertedBadge;
    }

    const { data: allBadges } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id, seat_number, is_transferable, earned_at")
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      badge: newBadge,
      seatNumber: newBadge?.seat_number || null,
      seatLabel: formatCharterSeatLabel(newBadge?.seat_number),
      perks: badgeDef.perks || {},
      badges: allBadges || [],
    });

  } catch (err) {
    console.error("[CLAIM API] Error during badge claim process:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
