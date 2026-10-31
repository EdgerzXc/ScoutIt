import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { recordSystemEvent } from "@/lib/systemEvents";

export const dynamic = "force-dynamic";

const adminNotificationSchema = z.object({
  targetType: z.enum(["broadcast", "role", "targeted"]),
  targetRole: z.string().optional(),
  targetUserIds: z.array(z.string()).optional(),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  message: z.string().min(2, "Message must be at least 2 characters").max(2000),
  notificationType: z.string().max(50).default("staff_notice"),
  icon: z.string().max(20).default("radio"),
  link: z.string().max(500).optional(),
  forceEmail: z.boolean().default(false),
});

/**
 * GET /api/admin/notifications
 * Returns statistics, recent broadcasts, and searchable user profiles for targeted outreach.
 */
export async function GET(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN NOTIFICATIONS" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error: missing service client" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    // 1. Total users
    const { count: totalUsers, error: countErr } = await supabaseAdmin
      .from("user_profiles")
      .select("id", { count: "exact", head: true });

    if (countErr) {
      console.warn("[ADMIN NOTIFICATIONS API] Count error:", countErr);
    }

    // 2. Recent broadcasts & staff notices
    const { data: recent, error: recentErr } = await supabaseAdmin
      .from("user_notifications")
      .select("id, title, desc, icon, notification_type, notify_channels, created_at, read")
      .in("notification_type", ["staff_notice", "system_broadcast", "dispute_notice", "promotional", "admin_direct"])
      .order("created_at", { ascending: false })
      .limit(30);

    if (recentErr) {
      console.warn("[ADMIN NOTIFICATIONS API] Recent notifications fetch error:", recentErr);
    }

    // 3. Searchable user profiles
    let userQuery = supabaseAdmin
      .from("user_profiles")
      .select("id, display_name, role, active_roles, prc_license, is_example_account")
      .order("created_at", { ascending: false })
      .limit(60);

    if (q) {
      userQuery = userQuery.ilike("display_name", `%${q}%`);
    }

    const { data: availableUsers, error: usersErr } = await userQuery;
    if (usersErr) {
      console.warn("[ADMIN NOTIFICATIONS API] Users search error:", usersErr);
    }

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      recentBroadcasts: recent || [],
      availableUsers: availableUsers || [],
    });
  } catch (err) {
    console.error("[ADMIN NOTIFICATIONS API] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

/**
 * POST /api/admin/notifications
 * Dispatches a notification to all users, a specific role, or targeted user IDs.
 */
export async function POST(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN NOTIFICATIONS" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error: missing service client" }, { status: 500 });
    }

    const body = await request.json();
    const parsed = adminNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input data" }, { status: 400 });
    }

    const { targetType, targetRole, targetUserIds, title, message, notificationType, icon, link, forceEmail } = parsed.data;

    let recipientIds = [];

    if (targetType === "broadcast") {
      const { data: profiles, error: profErr } = await supabaseAdmin
        .from("user_profiles")
        .select("id");
      if (profErr) {
        console.error("[ADMIN NOTIFICATIONS API] Failed to fetch broadcast recipients:", profErr);
        return NextResponse.json({ error: "Failed to resolve broadcast recipients" }, { status: 500 });
      }
      recipientIds = (profiles || []).map((p) => p.id).filter(Boolean);
    } else if (targetType === "role") {
      if (!targetRole) {
        return NextResponse.json({ error: "Target role is required when targetType is 'role'" }, { status: 400 });
      }
      const roleToMatch = targetRole.toLowerCase();
      // Fetch user profiles to filter by role or active_roles
      const { data: profiles, error: profErr } = await supabaseAdmin
        .from("user_profiles")
        .select("id, role, active_roles");
      if (profErr) {
        console.error("[ADMIN NOTIFICATIONS API] Failed to fetch role recipients:", profErr);
        return NextResponse.json({ error: "Failed to resolve role recipients" }, { status: 500 });
      }

      recipientIds = (profiles || [])
        .filter((p) => {
          const directRole = String(p.role || "").toLowerCase();
          const activeRoles = Array.isArray(p.active_roles)
            ? p.active_roles.map((r) => String(r).toLowerCase())
            : [];
          return directRole === roleToMatch || activeRoles.includes(roleToMatch);
        })
        .map((p) => p.id)
        .filter(Boolean);
    } else if (targetType === "targeted") {
      recipientIds = [...new Set((targetUserIds || []).map((id) => String(id || "").trim()).filter(Boolean))];
      if (recipientIds.length === 0) {
        return NextResponse.json({ error: "At least one target user ID must be provided" }, { status: 400 });
      }
    }

    recipientIds = [...new Set(recipientIds)];

    if (recipientIds.length === 0) {
      return NextResponse.json({ error: "No matching recipients found for this selection" }, { status: 404 });
    }

    const channels = ["in_app"];
    if (link && typeof link === "string" && link.trim()) {
      channels.push(`link:${link.trim()}`);
    }

    // Chunk inserts into batches of 100 to avoid payload caps
    const CHUNK_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < recipientIds.length; i += CHUNK_SIZE) {
      const chunk = recipientIds.slice(i, i + CHUNK_SIZE);
      const rows = chunk.map((uid) => ({
        user_id: uid,
        title,
        desc: message,
        icon: icon || "radio",
        notification_type: notificationType || "staff_notice",
        notify_channels: channels,
        read: false,
      }));

      const { error: insertErr } = await supabaseAdmin.from("user_notifications").insert(rows);
      if (insertErr) {
        console.error("[ADMIN NOTIFICATIONS API] Chunk insert failed:", insertErr);
      } else {
        insertedCount += chunk.length;
      }
    }

    // Audit log
    await recordSystemEvent({
      event: "admin_notification_dispatch",
      severity: "info",
      detail: `Admin ${gate.userId} dispatched ${notificationType} to ${insertedCount} recipients (${targetType})`,
      metadata: {
        admin_id: gate.userId,
        target_type: targetType,
        target_role: targetRole || null,
        recipient_count: insertedCount,
        title,
        notification_type: notificationType,
        force_email: forceEmail,
      },
    });

    return NextResponse.json({
      success: true,
      count: insertedCount,
      targetType,
      targetRole: targetRole || null,
    });
  } catch (err) {
    console.error("[ADMIN NOTIFICATIONS API] POST error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
