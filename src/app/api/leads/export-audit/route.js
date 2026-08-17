import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isLeadExportAuditActive } from "@/lib/leadExportGate";

const RELEASED_DEAL_STATUS = "accepted";
const RELEASED_HANDSHAKE_STATUS = "completed";
const AUDIT_PURPOSE = "crm_export";

const auditSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(500),
  format: z.enum(["csv", "vcard", "clipboard_copy"]),
}).strict();

function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, authorized: false, message, ...extra }, { status });
}
function hashScope(values) {
  return createHash("sha256").update([...values].sort().join("\n"), "utf8").digest("hex");
}
function completedContactHandshake(deal) {
  const handshakes = Array.isArray(deal.deal_handshakes) ? deal.deal_handshakes : [];
  return handshakes.some((row) => row.handshake_type === "transaction_handshake" && row.status === RELEASED_HANDSHAKE_STATUS);
}

export async function POST(req) {
  try {
    if (!isLeadExportAuditActive()) return fail("Lead export auditing is not active. Export is disabled.", 503, { disabled: true });
    if (!supabaseAdmin) return fail("Server database unconfigured.", 503);
    const userId = await resolveUserId(req);
    if (!userId) return fail("Authentication required.", 401);
    const parsed = auditSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Invalid export request payload.", 400);

    const normalizedIds = parsed.data.leadIds.map((id) => id.toLowerCase());
    const requestedIds = new Set(normalizedIds);
    if (requestedIds.size !== normalizedIds.length) return fail("Duplicate lead IDs are not allowed.", 400);

    const { data: deals, error: dealsErr } = await supabaseAdmin
      .from("deals")
      .select("id, broker_id, buyer_id, property_id, status, properties(owner_id), deal_handshakes(handshake_type, status)")
      .in("id", normalizedIds);
    if (dealsErr) {
      console.error("[api/leads/export-audit] Deals query error:", dealsErr);
      return fail("Failed to verify lead authorizations.", 500);
    }

    const foundDeals = Array.isArray(deals) ? deals : [];
    const foundIds = new Set(foundDeals.map((deal) => String(deal.id).toLowerCase()));
    if (foundDeals.length !== requestedIds.size || foundIds.size !== requestedIds.size || [...requestedIds].some((id) => !foundIds.has(id))) {
      return fail("One or more requested leads could not be verified.", 403);
    }

    const propertyIds = new Set();
    for (const deal of foundDeals) {
      const actorAuthorized = deal.broker_id === userId || deal.properties?.owner_id === userId;
      if (!actorAuthorized) return fail("Unauthorized: one or more leads are outside your CRM scope.", 403);
      if (deal.status !== RELEASED_DEAL_STATUS || !completedContactHandshake(deal)) {
        return fail("Contact details are not released for one or more selected leads.", 409);
      }
      if (!deal.property_id) return fail("One or more leads have no verifiable property scope.", 409);
      propertyIds.add(String(deal.property_id));
    }

    const { data: auditRow, error: auditErr } = await supabaseAdmin.from("lead_export_audit_log").insert({
      actor_id: userId,
      format: parsed.data.format,
      lead_count: requestedIds.size,
      property_count: propertyIds.size,
      lead_scope_hash: hashScope(requestedIds),
      property_scope_hash: hashScope(propertyIds),
      purpose_code: AUDIT_PURPOSE,
    }).select("id, created_at").single();
    if (auditErr || !auditRow?.id || !auditRow?.created_at) {
      console.error("[api/leads/export-audit] Audit log write failed:", auditErr || "missing receipt");
      return fail("Audit record creation failed. Export blocked for privacy compliance.", 503);
    }
    return NextResponse.json({
      success: true, authorized: true, auditId: auditRow.id, auditedAt: auditRow.created_at,
      leadCount: requestedIds.size, format: parsed.data.format,
    });
  } catch (error) {
    console.error("[api/leads/export-audit] Error:", error);
    return fail(sanitizeError(error, "Internal error during lead export authorization."), 500);
  }
}