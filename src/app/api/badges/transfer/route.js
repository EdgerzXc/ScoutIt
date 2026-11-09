import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { invalidateBadgesCache } from "@/app/api/badges/route";
import {
  BADGE_DEFINITIONS,
  isPioneerBadge,
  hasAnyPioneerBadge,
  formatCharterSeatLabel,
} from "@/lib/BadgeEngine";

const checkTransferRate = createRateLimiter({ limit: 5, windowMs: 60_000, maxKeys: 2000 });

const REQUIRED_ROLES = {
  PIONEER_BROKER: ["broker"],
  PIONEER_OWNER: ["owner"],
  PIONEER_CREATOR: ["provider", "photographer", "designer", "researcher", "creator"],
};

const ERROR_MESSAGES = {
  INVALID_PARTIES: "Invalid sender or recipient.",
  CANNOT_TRANSFER_TO_SELF: "Cannot transfer a charter seat to yourself.",
  NOT_BADGE_OWNER: "You do not own this badge.",
  BADGE_NOT_TRANSFERABLE: "This badge is not a transferable Charter license.",
  TRANSFER_LOCKED: "Charter seat is currently locked under transfer vesting.",
  RECIPIENT_ALREADY_HAS_PIONEER: "Recipient already holds a Pioneer Charter. Accounts are strictly limited to one Pioneer seat across all cohorts.",
};

export async function POST(request) {
  try {
    const senderId = await resolveUserId(request);
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    const ip = clientIp(request);
    const rate = checkTransferRate(`transfer:${ip}:${senderId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many transfer attempts. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds || 60) } }
      );
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

    // 1. Resolve Recipient (Dual-lookup: Auth Admin email registry + profile fallback)
    if (cleanInput.includes("@")) {
      const cleanEmail = cleanInput.toLowerCase();

      // Check auth.admin first (where emails reside in Supabase Auth)
      if (supabaseAdmin.auth?.admin?.listUsers) {
        try {
          const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const matchedUser = authData?.users?.find(
            (u) => u.email && u.email.toLowerCase() === cleanEmail
          );
          if (matchedUser?.id) {
            targetRecipientId = matchedUser.id;
          }
        } catch (authErr) {
          console.warn("[BADGE TRANSFER] auth.admin.listUsers warning:", authErr?.message);
        }
      }

      // Fallback: check user_profiles if email is stored on the profile row
      if (!targetRecipientId) {
        try {
          const { data: foundProfile } = await supabaseAdmin
            .from("user_profiles")
            .select("id, role, active_roles, email")
            .eq("email", cleanEmail)
            .maybeSingle();

          if (foundProfile?.id) {
            targetRecipientId = foundProfile.id;
          }
        } catch {
          // Column may not exist on user_profiles
        }
      }

      if (!targetRecipientId) {
        return NextResponse.json(
          { error: `Recipient with email "${cleanEmail}" not found on ScoutIt.` },
          { status: 404 }
        );
      }
    } else {
      targetRecipientId = cleanInput;
    }

    // 2. Strict Self-Transfer Prevention
    if (String(senderId).trim().toLowerCase() === String(targetRecipientId).trim().toLowerCase()) {
      return NextResponse.json({ error: "Cannot transfer a charter seat to yourself." }, { status: 400 });
    }

    // 3. Verify Recipient Profile Standing & Exclusions
    const { data: recipientProfile, error: profileErr } = await supabaseAdmin
      .from("user_profiles")
      .select("id, role, active_roles, is_banned, status, archived_at")
      .eq("id", targetRecipientId)
      .maybeSingle();

    if (profileErr || !recipientProfile) {
      return NextResponse.json(
        { error: "Recipient account not found or has not completed initial profile setup." },
        { status: 404 }
      );
    }

    if (recipientProfile.is_banned === true || recipientProfile.status === "suspended" || recipientProfile.archived_at) {
      return NextResponse.json(
        { error: "Cannot transfer charter seat to a suspended, banned, or deactivated account." },
        { status: 403 }
      );
    }

    // 4. Verify Sender Ownership
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

    // 5. Verify Vesting / Cooldown Lock
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

    // 6. Verify Recipient Role Eligibility
    const required = REQUIRED_ROLES[badgeId];
    if (required) {
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

    // 7. Enforce Strict "One Pioneer Per Account" on Recipient
    if (isPioneerBadge(badgeId)) {
      const { data: recipientBadges } = await supabaseAdmin
        .from("user_badges")
        .select("badge_id, seat_number")
        .eq("user_id", targetRecipientId);

      if (hasAnyPioneerBadge(recipientBadges)) {
        return NextResponse.json(
          { error: "Recipient already holds a Pioneer Charter. Accounts are strictly limited to one Pioneer seat across all cohorts." },
          { status: 409 }
        );
      }
    }

    // 8. Execute Transfer via Atomic RPC
    const cleanNotes = notes ? String(notes).trim().slice(0, 500) : "Member portal secondary transfer";
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("transfer_pioneer_badge_atomic", {
      p_from_user_id: senderId,
      p_to_user_id: targetRecipientId,
      p_badge_id: badgeId,
      p_notes: cleanNotes,
    });

    let transferredRecord = null;
    if (!rpcError && rpcResult && rpcResult.length > 0) {
      const outcome = rpcResult[0];
      if (!outcome.success) {
        const errMessage = ERROR_MESSAGES[outcome.error_code] || outcome.error_code || "Transfer failed";
        return NextResponse.json({ error: errMessage }, { status: 400 });
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
          notes: cleanNotes,
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

    invalidateBadgesCache();

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
