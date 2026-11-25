import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { notifyUser, validateSampleNotificationRouting, resolveDefaultNotificationLink } from "@/lib/notifications";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

export const dynamic = "force-dynamic";

const checkNotificationsWriteRate = createRateLimiter({
  limit: 30,
  windowMs: 60_000,
  maxKeys: 5000,
});

const ALLOWED_CLIENT_NOTIFICATION_TYPES = new Set([
  "system",
  "property_published",
  "property_draft_saved",
  "property_drafting",
  "property_updated",
  "listing_saved",
  "workspace_notice",
]);

function normalizeRelativeNotificationLink(link) {
  if (!link || typeof link !== "string") return null;
  const trimmed = link.trim();
  if (!/^\/(?!\/)/.test(trimmed)) return null;
  return trimmed;
}

// Persists the dashboard bell dropdown (Track 1,
// PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md) — previously
// DashboardContext.js held notifications in memory only, lost on refresh.



export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_notifications")
      .select("id, title, desc, icon, read, property_id, notification_type, notify_channels, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[NOTIFICATIONS API] GET error:", error);
      return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
    }

    return NextResponse.json({
      notifications: (data || []).map((n) => {
        const channels = Array.isArray(n.notify_channels) ? n.notify_channels : [];
        const linkChannel = channels.find((c) => typeof c === "string" && c.startsWith("link:"));
        const explicitLink = linkChannel ? linkChannel.slice(5) : null;
        const computedLink = explicitLink || resolveDefaultNotificationLink(n.notification_type, n.property_id);

        return {
          id: n.id,
          title: n.title,
          desc: n.desc,
          icon: n.icon,
          read: n.read,
          propertyId: n.property_id,
          notificationType: n.notification_type,
          link: computedLink,
          createdAt: n.created_at,
        };
      }),
    });
  } catch (err) {
    console.error("[NOTIFICATIONS API] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

const patchSchema = z.object({
  ids: z.array(z.string()).max(200).optional(), // omit to mark ALL read
});

export async function PATCH(request) {
  try {
    const rate = checkNotificationsWriteRate(clientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many notification writes" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }
    const rawBody = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { ids  } = parsed.data;
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    let query = supabaseAdmin.from("user_notifications").update({ read: true }).eq("user_id", userId);
    if (ids && ids.length > 0) query = query.in("id", ids);
    const { error } = await query;

    if (error) {
      console.error("[NOTIFICATIONS API] PATCH error:", error);
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[NOTIFICATIONS API] PATCH error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { error } = await supabaseAdmin.from("user_notifications").delete().eq("user_id", userId);
    if (error) {
      console.error("[NOTIFICATIONS API] DELETE error:", error);
      return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[NOTIFICATIONS API] DELETE error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

const postSchema = z.object({
  title: z.string().max(200),
  desc: z.string().max(1000),
  icon: z.string().max(20).optional(),
  propertyId: z.string().uuid().optional(),
  notificationType: z.string().max(100),
  link: z.string().max(500).optional(),
});

// Lets client-triggered notifications (e.g. "Listing Published") persist
// through the same table as the server-triggered ones, per the plan's
// recommendation to route everything through one migration/table.
export async function POST(request) {
  try {
    const rate = checkNotificationsWriteRate(clientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many notification writes" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }
    const rawBody = await request.json().catch(() => null);
    const parsed = postSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { title, desc, icon, propertyId, notificationType, link } = parsed.data;
    if (!ALLOWED_CLIENT_NOTIFICATION_TYPES.has(notificationType)) {
      return NextResponse.json({ error: "Unsupported notification type" }, { status: 400 });
    }
    const safeLink = normalizeRelativeNotificationLink(link);
    if (link && !safeLink) {
      return NextResponse.json({ error: "Invalid notification link" }, { status: 400 });
    }
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const routing = await validateSampleNotificationRouting(supabaseAdmin, { userId, propertyId });
    if (!routing.ok) {
      return NextResponse.json({ error: "Property notification routing is unavailable for this recipient." }, { status: 403 });
    }
    const notified = await notifyUser(supabaseAdmin, {
      userId,
      title,
      desc,
      icon: icon || "🔔",
      propertyId: propertyId || null,
      notificationType,
      link: safeLink,
    });
    if (!notified) return NextResponse.json({ error: "Failed to save notification" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[NOTIFICATIONS API] POST error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
