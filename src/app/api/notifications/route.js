import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Persists the dashboard bell dropdown (Track 1,
// PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md) — previously
// DashboardContext.js held notifications in memory only, lost on refresh.

async function resolveUserId(request, mockOwnerId) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (token && token.trim() !== "") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) return user.id;
  }
  if (mockOwnerId === "master-dev") return "master-dev";
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mockOwnerId = searchParams.get("mockOwnerId");
    const userId = await resolveUserId(request, mockOwnerId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_notifications")
      .select("id, title, desc, icon, read, property_id, notification_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[NOTIFICATIONS API] GET error:", error);
      return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
    }

    return NextResponse.json({
      notifications: (data || []).map((n) => ({
        id: n.id,
        title: n.title,
        desc: n.desc,
        icon: n.icon,
        read: n.read,
        propertyId: n.property_id,
        notificationType: n.notification_type,
        createdAt: n.created_at,
      })),
    });
  } catch (err) {
    console.error("[NOTIFICATIONS API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  mockOwnerId: z.string().optional(),
  ids: z.array(z.string()).max(200).optional(), // omit to mark ALL read
});

export async function PATCH(request) {
  try {
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { mockOwnerId, ids } = parsed.data;
    const userId = await resolveUserId(request, mockOwnerId);
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
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mockOwnerId = searchParams.get("mockOwnerId");
    const userId = await resolveUserId(request, mockOwnerId);
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
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

const postSchema = z.object({
  mockOwnerId: z.string().optional(),
  title: z.string().max(200),
  desc: z.string().max(1000),
  icon: z.string().max(20).optional(),
  propertyId: z.string().optional(),
  notificationType: z.string().max(100),
});

// Lets client-triggered notifications (e.g. "Listing Published") persist
// through the same table as the server-triggered ones, per the plan's
// recommendation to route everything through one migration/table.
export async function POST(request) {
  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { mockOwnerId, title, desc, icon, propertyId, notificationType } = parsed.data;
    const userId = await resolveUserId(request, mockOwnerId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { error } = await supabaseAdmin.from("user_notifications").insert([{
      user_id: userId,
      title,
      desc,
      icon: icon || "🔔",
      property_id: propertyId || null,
      notification_type: notificationType,
    }]);

    if (error) {
      console.error("[NOTIFICATIONS API] POST error:", error);
      return NextResponse.json({ error: "Failed to save notification" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[NOTIFICATIONS API] POST error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
