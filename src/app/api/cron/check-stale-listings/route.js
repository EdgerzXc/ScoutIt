import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchPropertyVerificationDates } from "@/lib/airtable";
import { notifyUser } from "@/lib/notifications";

// Daily Vercel Cron (see vercel.json). Track 1,
// PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md. Flags approved
// properties whose Airtable Last_Verified_Date is missing or older than
// STALE_DAYS, notifies the owner (and, if configured, a hardcoded
// super-admin — there's no admin_users table yet, see the plan's Track 3).
// Dedupes by skipping properties that already got a stale_listing
// notification within the STALE_DAYS window, so this doesn't re-fire daily.
const STALE_DAYS = 30;

export async function GET(request) {
  // Vercel sets this header automatically when invoking a configured cron
  // job if CRON_SECRET is set in the project's env vars. Soft-enforced: if
  // CRON_SECRET isn't set (e.g. local dev), the check is skipped rather than
  // locking the route out.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    return NextResponse.json({ error: "Airtable credentials missing" }, { status: 500 });
  }

  try {
    const [{ data: properties, error: propError }, verificationRecords] = await Promise.all([
      supabaseAdmin.from("properties").select("id, slug, owner_id, title").eq("pipeline_status", "approved"),
      fetchPropertyVerificationDates(apiKey, baseId),
    ]);

    if (propError) {
      console.error("[CRON check-stale-listings] Failed to load properties:", propError);
      return NextResponse.json({ error: "Failed to load properties" }, { status: 500 });
    }

    const verificationBySlug = new Map(verificationRecords.map((v) => [v.slug, v]));
    const now = Date.now();
    const staleCutoffMs = STALE_DAYS * 24 * 60 * 60 * 1000;

    const staleProperties = (properties || []).filter((p) => {
      if (!p.slug || !p.owner_id) return false;
      const verification = verificationBySlug.get(p.slug);
      if (!verification) return false; // not synced to Airtable yet — not this cron's problem
      if (!verification.lastVerifiedDate) return true;
      const verifiedMs = new Date(verification.lastVerifiedDate).getTime();
      if (Number.isNaN(verifiedMs)) return true;
      return now - verifiedMs > staleCutoffMs;
    });

    const adminUserId = process.env.STALE_LISTING_ADMIN_USER_ID || null;
    let notified = 0;
    let skippedDupe = 0;

    // Fetch existing notifications for all stale properties at once to avoid N+1 queries
    const existingNotificationsSet = new Set();
    if (staleProperties.length > 0) {
      const propertyIds = staleProperties.map((p) => p.id);
      const { data: existingBatch } = await supabaseAdmin
        .from("user_notifications")
        .select("property_id")
        .in("property_id", propertyIds)
        .eq("notification_type", "stale_listing")
        .gte("created_at", new Date(now - staleCutoffMs).toISOString());

      if (existingBatch) {
        existingBatch.forEach((row) => existingNotificationsSet.add(row.property_id));
      }
    }

    for (const property of staleProperties) {
      if (existingNotificationsSet.has(property.id)) {
        skippedDupe++;
        continue;
      }

      const title = "Listing needs a refresh";
      const desc = `"${property.title}" hasn't been verified in over ${STALE_DAYS} days. Re-confirm its details to keep it trustworthy.`;

      await notifyUser(supabaseAdmin, {
        userId: property.owner_id,
        title,
        desc,
        icon: "🕓",
        propertyId: property.id,
        notificationType: "stale_listing",
      });
      if (adminUserId) {
        await notifyUser(supabaseAdmin, {
          userId: adminUserId,
          title: `[Admin] ${title}`,
          desc,
          icon: "🕓",
          propertyId: property.id,
          notificationType: "stale_listing",
        });
      }
      notified++;
    }

    return NextResponse.json({
      success: true,
      checked: (properties || []).length,
      stale: staleProperties.length,
      notified,
      skippedDupe,
    });
  } catch (err) {
    console.error("[CRON check-stale-listings] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
