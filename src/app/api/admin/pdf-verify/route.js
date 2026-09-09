// ═══════════════════════════════════════════════════════════════
// PDF-ASSISTED DRAFT VERIFICATION — A-076
//
// WHY THIS EXISTS
// AGENTS.md §2.4 mandates that a ScoutIt-created PDF-assisted draft is checked
// against its source document before publication. Every piece of that workflow
// existed except the one that runs it:
//
//   • the publish-time block  — /api/dashboard/publish/route.js:69 (422)   EXISTS
//   • the unlock RPC          — verify_pdf_draft, service_role-only        EXISTS
//   • any caller of the RPC                                                ZERO
//   • anything writing creation_source: 'pdf_assisted'                     ZERO
//
// ⚠️ THE CORRECTION THAT MATTERS (verified 2026-09-05).
// A-076 recorded this as a gate whose two ends were both unbuilt. The producer
// is in fact BUILT AND LIVE: `OwnerMode.js:360` uploads an owner PDF to
// /api/ai/read-pdf, hands the text to /api/ai/assimilate, and creates a draft.
// It simply never tagged the row, so `creation_source` defaulted to 'manual'.
//
// So the mandated verification has silently never applied to a single real
// listing — not because the workflow was missing, but because the door was
// never labelled. This route is the key; tagging the producer is the label,
// and the two must ship together or PDF listings become unpublishable.
//
// SECURITY
// • `requireAdmin` before any read or write — the one gate (Rule 6).
// • The RPC is SECURITY DEFINER and granted to service_role only, so it runs
//   through `supabaseAdmin`. It scopes its own UPDATE to
//   `creation_source = 'pdf_assisted'` and returns FOUND, so verifying a row
//   that is not a PDF draft is a no-op that reports false rather than a
//   silent success.
// • Every verification is audited. A staff attestation that leaves no record
//   is not an attestation.
//
// ⚠️ KNOWN, DOCUMENTED WEAKNESS — see WAITING A-076.
// `authenticated` still holds column-level UPDATE on `creation_source`, proven
// live on 2026-09-05 inside a rolled-back transaction with a passing control.
// An owner can therefore flip their own draft back to 'manual' and walk past
// the 422 entirely. `pdf_verified` itself is correctly locked (U-015). The
// revoke is prepared but NOT applied — it needs the owner's migration gate.
// This route is still worth shipping: it closes the legitimate path, and the
// bypass requires deliberately crafting a PostgREST call.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { writeAuditLog } from "@/lib/auditTrail";
import { sanitizeError } from "@/lib/sanitizeError";

// Only what the review card renders. `pdf_source_url` is the document the
// staff member is meant to be checking against, so it is the one addition
// over the ordinary queue shape.
const QUEUE_FIELDS =
  "id, title, location, type, owner_id, created_at, pdf_source_url, pdf_verified";

const NO_STORE = { "Cache-Control": "no-store" };

// ── GET /api/admin/pdf-verify ───────────────────────────────────
// PDF-assisted drafts still awaiting their source-document check.
export async function GET(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PDF VERIFY" });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "The verification queue is unavailable right now." },
        { status: 503, headers: NO_STORE },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("properties")
      .select(QUEUE_FIELDS)
      .eq("creation_source", "pdf_assisted")
      .eq("pdf_verified", false)
      .order("created_at", { ascending: true }); // oldest first — nobody waits longest by accident

    if (error) {
      console.error("[ADMIN PDF VERIFY] Query failed:", error);
      return NextResponse.json(
        { error: sanitizeError(error, "Could not load the verification queue.") },
        { status: 500, headers: NO_STORE },
      );
    }

    return NextResponse.json({ drafts: data || [] }, { headers: NO_STORE });
  } catch (err) {
    console.error("[ADMIN PDF VERIFY] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not load the verification queue.") },
      { status: 500, headers: NO_STORE },
    );
  }
}

// ── POST /api/admin/pdf-verify ──────────────────────────────────
// Body: { propertyId }
// Records that a staff member compared the draft against its source document.
export async function POST(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PDF VERIFY" });
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Verification is unavailable right now." },
        { status: 503, headers: NO_STORE },
      );
    }

    const body = await request.json().catch(() => ({}));
    const propertyId = body?.propertyId;
    if (!propertyId) {
      return NextResponse.json(
        { error: "Missing propertyId" },
        { status: 400, headers: NO_STORE },
      );
    }

    // ⚠️ NOT `rpc("verify_pdf_draft")`. That function is BROKEN in the live
    // database and always has been — verified 2026-09-05:
    //
    //   ERROR 42703: column "updated_at" of relation "properties" does not exist
    //   CONTEXT: PL/pgSQL function verify_pdf_draft(uuid,text) line 3
    //
    // `properties` has `created_at`, `published_at`, `archived_at` and others,
    // but no `updated_at`. Every call throws. Nobody found out because nothing
    // ever called it (Standing Rule 15: RUN the endpoint before building a UI
    // on it — the failure was silent for a month).
    //
    // Fixing the function needs a migration, which is owner-gated. This does
    // the same work through the service client, keeping the RPC's own scoping
    // (`creation_source = 'pdf_assisted'`) so a non-PDF row still matches
    // nothing. Proven live in a rolled-back transaction. The migration that
    // repairs the dead function is prepared at
    // `supabase/migrations/20260905000001_lock_creation_source.sql`.
    const { data: updated, error } = await supabaseAdmin
      .from("properties")
      .update({ pdf_verified: true })
      .eq("id", propertyId)
      .eq("creation_source", "pdf_assisted")
      .select("id");

    if (error) {
      console.error("[ADMIN PDF VERIFY] Update failed:", error);
      return NextResponse.json(
        { error: sanitizeError(error, "Could not record the verification.") },
        { status: 500, headers: NO_STORE },
      );
    }

    // No matched row means a wrong id, or a listing that was never
    // PDF-assisted. Reporting that as success would record an attestation
    // about nothing (Rule 7).
    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: "No PDF-assisted draft matched that id. Nothing was verified." },
        { status: 404, headers: NO_STORE },
      );
    }

    // Non-blocking by design, but never silent — see lib/auditTrail.js.
    await writeAuditLog(supabaseAdmin, {
      action: "PDF_DRAFT_VERIFIED",
      tableName: "properties",
      recordId: propertyId,
      userId: auth.userId,
      metadata: { source: "admin_console", requirement: "AGENTS.md §2.4" },
    });

    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("[ADMIN PDF VERIFY] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not record the verification.") },
      { status: 500, headers: NO_STORE },
    );
  }
}
