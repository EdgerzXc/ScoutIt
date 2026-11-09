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
    const senderId = await resolveUserId(request);
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error: database unavailable." }, { status: 500 });
    }

    const body = await request.json();
    const { badgeId, notes } = body || {};
    const recipientRaw = body?.recipientInput || body?.recipientEmail || body?.recipientUserId;

    if (!badgeId) {
      return NextResponse.json({ error: "Missing badgeId." }, { status: 400 });
    }

    if (!recipientRaw) {
      return NextResponse.json({ error: "Recipient email or user ID is required." }, { status: 400 });
    }

    const cleanInput = String(recipientRaw).trim();
    let targetRecipientId = null;

    if (cleanInput.includes("@")) {
      const cleanEmail = cleanInput.toLowerCase();
      const { data: foundProfile, error: profileErr } = await supabaseAdmin
        .from("user_profiles")
        .select("id, role, active_roles, email")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profileErr || !foundProfile) {
        return NextResponse.json(
          { error: `Recipient with email "${cleanEmail}" not found on ScoutIt.` },
          { status: 404 }
        );
      }
      targetRecipientId = foundProfile.id;
    } else {
      targetRecipientId = cleanInput;
    }

    if (senderId === targetRecipientId) {
      return NextResponse.json({ error: "Cannot transfer a charter seat to yourself." }, { status: 400 });
    }

    // 2. Verify Sender Ownership
    const { data: senderBadge, error: senderBadgeErr } = await supabaseAdmin
      .from("user_badges")
      .select("id, user_id, badge_id, seat_number, is_transferable, transfer_locked_until")
      .eq("user_id", senderId)
      .eq("badge_id", badgeId)
      .maybeSingle();

    if (senderBadgeErr || !senderBadge) {
      return NextResponse.json({ error: "You do not own this badge." }, { status: 403 });
    }

    if (!senderBadge.is_transferable) {
      return NextResponse.json(
        { error: "This badge is not a transferable Charter license." },
        { status: 403 }
      );
    }

    // 3. Verify Vesting / Cooldown Lock
    if (senderBadge.transfer_locked_until) {
      const lockDate = new Date(senderBadge.transfer_locked_until);
      if (lockDate.getTime() > Date.now()) {
        const daysRemaining = Math.ceil((lockDate.getTime() - Date.now()) / (86400 * 1000));
        return NextResponse.json(
          {
            error: `Charter seat is under transfer vesting lock for another ${daysRemaining} day(s). Transfers unlock on ${lockDate.toLocaleDateString()}.`,
          },
          { status: 423 }
        );
      }
    }

    // 4. Verify Recipient Role Eligibility
    const required = REQUIRED_ROLES[badgeId];
    if (required) {
      const { data: recipientProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("role, active_roles")
        .eq("id", targetRecipientId)
        .maybeSingle();

      const userRoles = new Set(
        [recipientProfile?.role, ...(Array.isArray(recipientProfile?.active_roles) ? recipientProfile.active_roles : [])]
          .filter(Boolean)
          .map((r) => String(r).toLowerCase())
      );

      if (!required.some((r) => userRoles.has(r))) {
        return NextResponse.json(
          { error: `Recipient must have an accredited ${required[0]} role to hold this charter.` },
          { status: 422 }
        );
      }
    }

    // 5. Enforce Strict "One Pioneer Per Account" on Recipient
    if (isPioneerBadge(badgeId)) {
      const { data: recipientBadges } = await supabaseAdmin
        .from("user_badges")
        .select("badge_id, seat_number")
        .eq("user_id", targetRecipientId);

      if (hasAnyPioneerBadge(recipientBadges)) {
        return NextResponse.json(
          { error: "Recipient already holds a Pioneer Charter. Accounts are strictly limited to one Pioneer seat." },
          { status: 409 }
        );
      }
    }

    // 6. Execute Transfer via Atomic RPC
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("transfer_pioneer_badge_atomic", {
      p_from_user_id: senderId,
      p_to_user_id: targetRecipientId,
      p_badge_id: badgeId,
      p_notes: notes || "Transfer executed via member portal",
    });

    let transferredRecord = null;
    if (!rpcError && rpcResult && rpcResult.length > 0) {
      const outcome = rpcResult[0];
      if (!outcome.success) {
        return NextResponse.json({ error: outcome.error_code || "Transfer failed" }, { status: 400 });
      }
      transferredRecord = outcome.badge_record;
    } else {
      // Fallback update if RPC is not yet registered in environment
      const cooldownDate = new Date(Date.now() + 90 * 86400 * 1000).toISOString();
      const { data: updatedBadge, error: updateErr } = await supabaseAdmin
        .from("user_badges")
        .update({
          user_id: targetRecipientId,
          granted_by: `transfer_from_${senderId}`,
          transfer_locked_until: cooldownDate,
        })
        .eq("id", senderBadge.id)
        .select()
        .single();

      if (updateErr) {
        console.error("[BADGE TRANSFER] Update error:", updateErr);
        return NextResponse.json({ error: "Failed to reassign badge." }, { status: 500 });
      }

      // Record transfer in audit table
      try {
        await supabaseAdmin.from("badge_transfers").insert({
          badge_id: badgeId,
          seat_number: senderBadge.seat_number || 1,
          from_user_id: senderId,
          to_user_id: targetRecipientId,
          status: "completed",
          notes: notes || "Member portal secondary transfer",
        });
      } catch (auditErr) {
        console.warn("[BADGE TRANSFER] Transfer audit log warning:", auditErr?.message);
      }

      transferredRecord = updatedBadge;
    }

    // 7. Dispatch in-app notification to recipient
    const seatLabel = formatCharterSeatLabel(senderBadge.seat_number) || "Pioneer Charter";
    try {
      await supabaseAdmin.from("user_notifications").insert({
        user_id: targetRecipientId,
        title: `Charter Transferred: ${seatLabel}`,
        desc: `You have received ${seatLabel} (${BADGE_DEFINITIONS[badgeId]?.name || badgeId}). All associated perks are now active.`,
        notification_type: "badge_awarded",
      });
    } catch {
      // Notification is non-blocking
    }

    return NextResponse.json({
      success: true,
      badgeId,
      seatNumber: senderBadge.seat_number || null,
      seatLabel,
      transferredTo: targetRecipientId,
      badge: transferredRecord,
    });
  } catch (err) {
    console.error("[BADGE TRANSFER API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
