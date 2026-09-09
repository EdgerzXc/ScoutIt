// ═══════════════════════════════════════════════════════════════
// STAFF PENDING-SUBMISSION QUEUE — A-073
//
// WHY THIS EXISTS
// `/admin`'s Pending Approvals panel read Supabase DIRECTLY from the browser
// with the anon key:
//
//   supabase.from('properties').select('*').eq('pipeline_status','pending')
//
// Read against the live database, the only SELECT policies on `properties` are
// `lifecycle_state = 'live'` and `owner_id = auth.uid()`. There is NO staff or
// admin bypass policy. And `lib/propertyLifecycle.js` maps
// `pipeline_status: 'pending'` to `lifecycle_state: 'draft'`.
//
// So the query returns only pending listings the viewer PERSONALLY OWNS.
// A staff member reviewing third-party submissions sees an empty queue — the
// tool built to surface that work cannot see it. `/api/admin/approve` works
// fine if you already hold the submission id; the queue that hands you the id
// did not.
//
// ⚠️ It is latent rather than currently biting: verified 2026-09-05, all three
// pending rows are owned by an `admin` account, so the founder happens to see
// all of them through the `owner_id` policy. It bites on the first external
// submission.
//
// THE FIX IS THE READ, NOT A NEW POLICY
// Adding a staff SELECT policy to `properties` would widen anon-key browser
// access for everyone holding a staff role — a bigger blast radius than the
// problem. Instead the read moves server-side behind `requireAdmin` and uses
// the service client, which is the pattern every other `/api/admin/*` route
// already follows.
//
// SECURITY
// • `requireAdmin` first, before any data is read — the same one gate as the
//   rest of `/api/admin/*`. A valid session is not enough (Rule 6: positive
//   checks only).
// • Returns ONLY the six fields the queue renders. The staff property editor's
//   header warns that internal fields (staff notes, pipeline state, internal
//   pricing) must not reach a client that did not earn them; `select('*')`
//   shipped all of them.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { sanitizeError } from "@/lib/sanitizeError";

// Exactly what the Pending Approvals card renders — nothing more.
const QUEUE_FIELDS = "id, title, type, location, coordinates, owner_id, created_at";

// ── GET /api/admin/pending ──────────────────────────────────────
// Every pending submission, not only the caller's own.
export async function GET(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PENDING" });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!supabaseAdmin) {
      // Fail loudly rather than returning [], which is indistinguishable from
      // "no submissions" and is the exact failure this route exists to end.
      return NextResponse.json(
        { error: "The submission queue is unavailable right now." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("properties")
      .select(QUEUE_FIELDS)
      .eq("pipeline_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN PENDING] Query failed:", error);
      return NextResponse.json(
        { error: sanitizeError(error, "Could not load the submission queue.") },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { properties: data || [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[ADMIN PENDING] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not load the submission queue.") },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
