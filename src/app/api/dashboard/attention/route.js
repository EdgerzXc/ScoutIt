import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { computeAttention } from "@/lib/dashboardAttention";
import { deriveMyRole, loadDealMessageActivity, loadUserDealRows } from "@/lib/deals/userDeals";
import { OPEN_TASK_STATUSES, serializeTask } from "@/lib/crm/taskModel";

export const dynamic = "force-dynamic";

// What needs the user right now, across Inbox, CRM and Calendar.
//
// One request rather than three: the home dashboard should not have to open
// every workspace to find out that none of them are on fire. The rules that
// turn rows into urgency live in lib/dashboardAttention.js — this route only
// fetches, and it fetches nothing the user is not already a party to.

const TASK_COLUMNS = "id, owner_user_id, assignee_user_id, deal_id, property_id, title, status, priority, due_at, completed_at, created_at, updated_at";

const APPOINTMENT_COLUMNS = "id, deal_id, host_id, guest_id, property_id, scheduled_at, status";

// crm_tasks and viewing_appointments key their party columns as uuid, and the
// only way to ask "mine or assigned to me" in PostgREST is an .or() filter
// built by string interpolation. An id that is not a uuid therefore reaches
// Postgres as raw filter text — it aborts the query with 22P02, and anything
// else it contained would have been filter syntax. The local preview identity
// ("master-dev") is exactly such an id. Check the shape before interpolating.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const now = new Date();
    // Only viewings that have not happened yet can still need anything.
    const horizon = new Date(now.getTime() - 60_000).toISOString();

    // A preview or non-uuid identity gets an honest empty read of the two
    // uuid-keyed tables rather than a database error.
    const uuidScoped = UUID_RE.test(userId);
    const notScoped = Promise.resolve({ data: [], error: null });

    const [dealResult, taskResult, appointmentResult] = await Promise.all([
      loadUserDealRows(supabaseAdmin, userId),
      !uuidScoped ? notScoped : supabaseAdmin
        .from("crm_tasks")
        .select(TASK_COLUMNS)
        // A task assigned to someone else is still their work, so both sides
        // see it — the same rule the CRM task list uses.
        .or(`owner_user_id.eq.${userId},assignee_user_id.eq.${userId}`)
        .in("status", OPEN_TASK_STATUSES)
        .limit(300),
      !uuidScoped ? notScoped : supabaseAdmin
        .from("viewing_appointments")
        .select(APPOINTMENT_COLUMNS)
        .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
        .gte("scheduled_at", horizon)
        .limit(200),
    ]);

    // A partly failed read is reported as partly unknown rather than as a calm
    // dashboard. Telling someone nothing needs them because a query failed is
    // the one outcome this feature must never produce.
    const unavailable = [
      dealResult.error ? "inbox" : null,
      taskResult.error ? "crm" : null,
      appointmentResult.error ? "calendar" : null,
    ].filter(Boolean);
    if (taskResult.error) console.error("[ATTENTION API] Task lookup error:", taskResult.error);
    if (appointmentResult.error) console.error("[ATTENTION API] Appointment lookup error:", appointmentResult.error);

    const dealRows = dealResult.rows || [];
    const { unreadByDeal, oldestUnreadByDeal } = await loadDealMessageActivity(
      supabaseAdmin,
      dealRows.map((row) => row.id),
      userId,
    );

    const deals = dealRows.map((row) => ({
      id: row.id,
      status: row.status,
      myRole: deriveMyRole(row, userId),
      unreadCount: unreadByDeal[row.id] || 0,
      oldestUnreadAt: oldestUnreadByDeal[row.id] || null,
      archivedAt: row.archived_at ?? null,
      pendingClockResetAt: row.pending_clock_reset_at ?? null,
    }));

    // Property titles turn "1 viewing still unconfirmed" into a line the user
    // can act on without opening the calendar first.
    const appointmentRows = appointmentResult.data || [];
    const propertyIds = [...new Set(appointmentRows.map((row) => row.property_id).filter(Boolean))];
    let propertyTitles = {};
    if (propertyIds.length > 0) {
      const { data: properties } = await supabaseAdmin
        .from("properties")
        .select("id, title")
        .in("id", propertyIds);
      propertyTitles = Object.fromEntries((properties || []).map((p) => [p.id, p.title]));
    }

    const attention = computeAttention({
      deals,
      tasks: (taskResult.data || []).map((row) => serializeTask(row)),
      appointments: appointmentRows.map((row) => ({
        id: row.id,
        status: row.status,
        scheduledAt: row.scheduled_at,
        propertyTitle: propertyTitles[row.property_id] || null,
      })),
      now: now.getTime(),
    });

    return NextResponse.json({ ...attention, unavailable, checkedAt: now.toISOString() });
  } catch (err) {
    console.error("[ATTENTION API] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
