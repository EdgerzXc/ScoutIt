import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isGlobalReadOnly } from "@/lib/featureFlags";
import { sanitizeError } from "@/lib/sanitizeError";
import { resolveBrokerAuthorityId } from "@/lib/brokerDossier";
import {
  CONTRIBUTION_KIND_LABELS,
  resolveContributionHref,
} from "@/lib/brokerContributions";

// ═══════════════════════════════════════════════════════════════
// CONTRIBUTION CREDITING — A-023 audit gap G2
//
// The dossier read `broker_contributions` and nothing wrote it, so the section
// could only ever be empty (Rule 21).
//
// This is STAFF-ONLY by design, and that is the whole point. A contribution is
// ScoutIt crediting a broker for work ScoutIt published — an answered question,
// an approved correction, a briefing, credited intel. If a broker could create
// their own, it would be a self-declared claim wearing a platform-credited
// label, which is exactly the distinction the dossier's provenance rules exist
// to preserve.
//
// The artifact path is validated with the SAME resolver the public projection
// uses, so a row that would be silently dropped at render time is refused at
// write time instead.
// ═══════════════════════════════════════════════════════════════

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) =>
  NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

const VALID_KINDS = new Set(Object.keys(CONTRIBUTION_KIND_LABELS));

export async function POST(request) {
  try {
    if (await isGlobalReadOnly()) {
      return json({ error: "System writes are temporarily frozen" }, 423);
    }

    const admin = await requireAdmin(request, { label: "CONTRIBUTION_CREDIT" });
    if (admin.error) return json({ error: admin.error }, admin.status);

    if (!supabaseAdmin) return json({ error: "Contributions are unavailable" }, 503);

    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "Invalid request body" }, 400);

    const brokerId = resolveBrokerAuthorityId(body.brokerId);
    if (!brokerId) return json({ error: "A broker Auth UUID is required" }, 422);

    const kind = String(body.kind || "").trim();
    if (!VALID_KINDS.has(kind)) {
      return json({ error: `Kind must be one of: ${[...VALID_KINDS].join(", ")}` }, 422);
    }

    const title = String(body.title || "").trim();
    if (!title || title.length > 300) {
      return json({ error: "A title of 1-300 characters is required" }, 422);
    }

    // Validated with the public projection's own resolver, so an artifact that
    // could never render is never stored.
    const artifactPath = resolveContributionHref(body.artifactPath);
    if (!artifactPath) {
      return json(
        { error: "artifactPath must be a site-internal absolute path, e.g. /intel/some-briefing" },
        422,
      );
    }

    const publish = body.publish === true;

    const { data: inserted, error } = await supabaseAdmin
      .from("broker_contributions")
      .insert({
        broker_id: brokerId,
        kind,
        title,
        artifact_path: artifactPath,
        status: publish ? "published" : "draft",
        // The schema requires a date whenever status is 'published'.
        published_at: publish ? new Date().toISOString() : null,
      })
      .select("id, status")
      .single();

    if (error) {
      console.error("[broker contributions] insert failed:", sanitizeError(error));
      return json({ error: "Could not credit this contribution" }, 503);
    }

    await supabaseAdmin
      .from("broker_social_proof_audit_events")
      .insert({
        contribution_id: inserted.id,
        actor_user_id: admin.userId,
        event_type: "contribution_published",
        event_payload: { kind, artifact_path: artifactPath, published: publish },
      })
      .then(null, () => null);

    return json({ id: inserted.id, status: inserted.status }, 201);
  } catch (error) {
    console.error("[broker contributions] credit failed:", sanitizeError(error));
    return json({ error: "Could not credit this contribution" }, 500);
  }
}

export async function PATCH(request) {
  try {
    if (await isGlobalReadOnly()) {
      return json({ error: "System writes are temporarily frozen" }, 423);
    }

    const admin = await requireAdmin(request, { label: "CONTRIBUTION_RETRACT" });
    if (admin.error) return json({ error: admin.error }, admin.status);
    if (!supabaseAdmin) return json({ error: "Contributions are unavailable" }, 503);

    const body = await request.json().catch(() => null);
    const id = String(body?.id || "").trim();
    if (!id) return json({ error: "A contribution id is required" }, 422);
    if (body?.action !== "retract") {
      return json({ error: "Action must be retract" }, 422);
    }

    // Retraction, not deletion: the credit is withdrawn from the public
    // projection while the record of having made it survives.
    const { data: retracted, error } = await supabaseAdmin
      .from("broker_contributions")
      .update({ status: "retracted", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("[broker contributions] retract failed:", sanitizeError(error));
      return json({ error: "Could not retract this contribution" }, 503);
    }
    if (!retracted) return json({ error: "Contribution not found" }, 404);

    await supabaseAdmin
      .from("broker_social_proof_audit_events")
      .insert({
        contribution_id: retracted.id,
        actor_user_id: admin.userId,
        event_type: "contribution_retracted",
        event_payload: {},
      })
      .then(null, () => null);

    return json({ id: retracted.id, status: retracted.status });
  } catch (error) {
    console.error("[broker contributions] retract failed:", sanitizeError(error));
    return json({ error: "Could not retract this contribution" }, 500);
  }
}
