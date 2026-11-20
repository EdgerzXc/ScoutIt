import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { notifyUser } from "@/lib/notifications";
import { resolveQueueDocument, removeReviewedQueueDocument } from "@/lib/propertyQueueStorage";

const REVIEW_SELECT = "id, owner_id, title, pdf_source_url, pdf_verified, pipeline_status";
const NO_STORE = { "Cache-Control": "private, no-store" };

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

function reviewSource(property) {
  return resolveQueueDocument({ owner_id: property.owner_id, pdf_source_url: property.pdf_source_url });
}

async function findDraft(propertyId) {
  return supabaseAdmin.from("properties")
    .select(REVIEW_SELECT)
    .eq("id", propertyId)
    .eq("creation_source", "pdf_assisted")
    .maybeSingle();
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PDF VERIFY" });
    if (auth.error) return json({ error: auth.error }, auth.status);
    if (!supabaseAdmin) return json({ error: "The verification queue is unavailable." }, 503);

    const propertyId = new URL(request.url).searchParams.get("propertyId");
    if (propertyId) {
      const { data: draft, error } = await findDraft(propertyId);
      if (error) return json({ error: "Could not load the draft." }, 503);
      if (!draft || draft.pdf_verified || draft.pipeline_status !== "pending") {
        return json({ error: "That draft is unavailable for verification." }, 404);
      }
      const document = reviewSource(draft);
      if (!document) return json({ error: "This draft has no source PDF to review." }, 409);

      const { data: reviewedDraft, error: reviewError } = await supabaseAdmin.rpc("read_property_pdf_review_facts", {
        p_property_id: draft.id,
        p_source_path: document.path,
      });
      if (reviewError) return json({ error: "Could not load the draft fields." }, 503);
      if (!reviewedDraft) return json({ error: "That draft changed. Refresh the review queue." }, 409);

      const { data, error: signingError } = await supabaseAdmin.storage.from(document.bucket)
        .createSignedUrl(document.path, 300, { download: "scoutit-source.pdf" });
      if (signingError || !data?.signedUrl) {
        return json({ error: "Could not open the source PDF. Refresh the link or check the upload." }, 503);
      }
      return json({ sourceUrl: data.signedUrl, reviewedDraft });
    }

    const { data, error } = await supabaseAdmin.from("properties")
      .select("id, title, location, type, owner_id, pdf_source_url, pdf_verified")
      .eq("creation_source", "pdf_assisted")
      .or("and(pdf_verified.eq.false,pipeline_status.eq.pending),and(pdf_verified.eq.true,pdf_source_url.not.is.null)")
      .order("created_at", { ascending: true }).limit(100);
    if (error) return json({ error: "Could not load the verification queue." }, 503);

    const drafts = (data || []).map(({ pdf_source_url, owner_id, pdf_verified, ...draft }) => ({
      ...draft,
      sourceAttached: Boolean(reviewSource({ pdf_source_url, owner_id })),
      cleanupPending: pdf_verified,
    }));
    return json({ drafts });
  } catch (error) {
    console.error("[pdf-review] Unable to read verification queue:", error?.code || error?.name);
    return json({ error: "Could not load the verification queue." }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PDF VERIFY" });
    if (auth.error) return json({ error: auth.error }, auth.status);
    if (!supabaseAdmin) return json({ error: "Verification is unavailable." }, 503);

    const body = await request.json().catch(() => null);
    const propertyId = typeof body?.propertyId === "string" ? body.propertyId.trim() : "";
    if (!propertyId) return json({ error: "A property ID is required." }, 400);

    const { data: draft, error } = await findDraft(propertyId);
    if (error) return json({ error: "Could not load the draft." }, 503);
    if (!draft) return json({ error: "PDF-assisted draft not found." }, 404);

    if (draft.pdf_verified) {
      const removed = !draft.pdf_source_url || await removeReviewedQueueDocument(supabaseAdmin, draft);
      return json({ success: true, cleanupPending: !removed });
    }

    if (draft.pipeline_status !== "pending") {
      return json({ error: "This draft is still being processed or needs a new PDF." }, 409);
    }
    if (body.sourceReviewed !== true || !body.reviewedDraft || typeof body.reviewedDraft !== "object" || Array.isArray(body.reviewedDraft)) {
      return json({ error: "Review the source and compare it with the draft before confirming." }, 400);
    }

    const document = reviewSource(draft);
    if (!document) return json({ error: "This draft has no source PDF to review." }, 409);

    const { data: source, error: storageError } = await supabaseAdmin.storage.from(document.bucket).info(document.path);
    if (storageError || !source) return json({ error: "The source PDF is unavailable. Verification has not been recorded." }, 409);

    const { data: recorded, error: recordError } = await supabaseAdmin.rpc("record_property_pdf_review", {
      p_property_id: draft.id,
      p_source_path: document.path,
      p_staff_id: auth.userId,
      p_reviewed_draft: body.reviewedDraft,
    });
    if (recordError) {
      console.error("[pdf-review] Attestation failed:", draft.id, recordError.code);
      return json({ error: "Could not record the verification." }, 503);
    }
    if (!recorded) return json({ error: "The draft changed. Reload it and compare it with the source again." }, 409);

    const removed = await removeReviewedQueueDocument(supabaseAdmin, { ...draft, pdf_verified: true });
    await notifyUser(supabaseAdmin, {
      userId: draft.owner_id,
      title: "PDF Listing Verified",
      desc: `Staff verified "${draft.title || "Property"}" against the source PDF. You can now publish the draft.`,
      propertyId: draft.id,
      notificationType: "pdf_verified",
    }).catch(() => {});

    return json({ success: true, cleanupPending: !removed });
  } catch (error) {
    console.error("[pdf-review] Unable to record verification:", error?.code || error?.name);
    return json({ error: "Could not record the verification." }, 500);
  }
}
