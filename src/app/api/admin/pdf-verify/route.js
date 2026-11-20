import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { notifyUser } from "@/lib/notifications";
import { resolveQueueDocument } from "@/lib/propertyQueueStorage";
import { loadPropertyPdfReview, verifyPropertyPdfDraft } from "@/lib/propertyPdfReview";

const NO_STORE = { "Cache-Control": "private, no-store" };

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export async function GET(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PDF VERIFY" });
    if (auth.error) return json({ error: auth.error }, auth.status);
    if (!supabaseAdmin) return json({ error: "The verification queue is unavailable." }, 503);

    const propertyId = new URL(request.url).searchParams.get("propertyId");
    if (propertyId) {
      const review = await loadPropertyPdfReview(supabaseAdmin, propertyId);
      return review.error ? json({ error: review.error }, review.status) : json(review);
    }

    const { data, error } = await supabaseAdmin.from("properties")
      .select("id, title, location, type, owner_id, pdf_source_url, pdf_verified")
      .eq("creation_source", "pdf_assisted")
      .or("and(pdf_verified.eq.false,pipeline_status.eq.pending),and(pdf_verified.eq.true,pdf_source_url.not.is.null)")
      .order("created_at", { ascending: true }).limit(100);
    if (error) return json({ error: "Could not load the verification queue." }, 503);

    const drafts = (data || []).map(({ pdf_source_url, owner_id, pdf_verified, ...draft }) => ({
      ...draft,
      sourceAttached: Boolean(resolveQueueDocument({ pdf_source_url, owner_id })),
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
    const result = await verifyPropertyPdfDraft(supabaseAdmin, body, auth.userId);
    if (result.error) return json({ error: result.error }, result.status);

    const { draft, cleanupPending } = result;
    if (draft) {
      await notifyUser(supabaseAdmin, {
        userId: draft.owner_id,
        title: "PDF Listing Verified",
        desc: `Staff verified "${draft.title || "Property"}" against the source PDF. You can now publish the draft.`,
        propertyId: draft.id,
        notificationType: "pdf_verified",
      }).catch(() => {});
    }
    return json({ success: true, cleanupPending });
  } catch (error) {
    console.error("[pdf-review] Unable to record verification:", error?.code || error?.name);
    return json({ error: "Could not record the verification." }, 500);
  }
}
