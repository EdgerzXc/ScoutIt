import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  confirmsPropertyApproval, deletePropertyById, insertProperty, isAirtableRecordBindingError,
  isAirtableRecordNotFoundError, unpublishPropertyByRecordId, updateProperty,
} from "@/lib/airtable";
import { invalidateCmsBundle } from "@/lib/cmsCache";
import { getPdfPublicationBlock } from "@/lib/propertyPdfReview";
import { isReservedPublicationAddress } from "@/lib/publicationAddress";
import {
  buildFirstPublicationUpdate, getPublicationBinding, hasPublicationHistory, isMarketVisible,
  isPermanentlyRemoved, isStaffSuspended, matchPublicationSnapshot,
} from "@/lib/propertyLifecycle";
import { looksLikeUuid } from "@/lib/propertyLookup";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";
import { sanitizeError } from "@/lib/sanitizeError";

function loadProperty(id) {
  return supabaseAdmin.from("properties").select("*").eq("id", id).maybeSingle();
}

async function refreshCatalogue(withdrawn = []) {
  try {
    const purge = await invalidateCmsBundle({ withdrawn });
    return purge.sharedCachePurged === false;
  } catch {
    return true;
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN APPROVE" });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { submissionId } = (await request.json().catch(() => null)) || {};
    if (!looksLikeUuid(submissionId)) {
      return NextResponse.json({ error: "A valid submission ID is required" }, { status: 400 });
    }
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) {
      return NextResponse.json({ error: "Publication is unavailable while Airtable is unavailable" }, { status: 503 });
    }

    const { data: submission, error: fetchError } = await loadProperty(submissionId);
    if (fetchError) throw fetchError;
    if (!submission) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    const pdfBlock = getPdfPublicationBlock(submission);
    if (pdfBlock) {
      return NextResponse.json({ error: "Only a verified PDF-assisted draft can be published.", reason: pdfBlock }, { status: 422 });
    }
    if (isPermanentlyRemoved(submission) || isStaffSuspended(submission) || submission.archived_at ||
        !["pending", "draft"].includes(submission.pipeline_status) ||
        (submission.lifecycle_state && !["draft", "pdf_verification"].includes(submission.lifecycle_state))) {
      return NextResponse.json({ error: "Only an active draft can be approved from this queue" }, { status: 409 });
    }
    if (!Object.hasOwn(submission, "publication_external_record_id")) {
      return NextResponse.json({ error: "Publication identity storage is unavailable" }, { status: 503 });
    }

    let binding = getPublicationBinding(submission);
    if (hasPublicationHistory(submission) && !binding) {
      return NextResponse.json({ error: "This listing requires publication identity reconciliation" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const point = typeof submission.coordinates === "string"
      ? submission.coordinates.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
      : null;
    const listing = {
      ...submission,
      last_verified_date: submission.last_verified_date || now,
      ...(point ? { longitude: Number(point[1]), latitude: Number(point[2]) } : {}),
    };
    let staged = false;
    let activationStarted = false;
    let privateSaveStarted = false;
    let publicConfirmed = false;
    try {
      if (!binding) {
        const draft = await insertProperty(apiKey, baseId, { ...listing, approved_for_scoutit: false });
        const slug = draft?.fields?.Slug;
        if (!confirmsPropertyApproval(draft, false) || typeof slug !== "string" || !slug.trim()) {
          throw new Error("Airtable did not confirm a private draft and its computed address");
        }
        binding = { slug, recordId: draft.id };
        staged = true;
        if (await isReservedPublicationAddress(supabaseAdmin, binding.slug, submission.id)) {
          await deletePropertyById(apiKey, baseId, binding.recordId);
          return NextResponse.json({ error: "This public address is reserved" }, { status: 409 });
        }
      }

      const publicFields = { ...listing, approved_for_scoutit: true, expectedRecordId: binding.recordId };
      delete publicFields.title;
      activationStarted = true;
      const published = await updateProperty(apiKey, baseId, binding.slug, publicFields);
      if (!confirmsPropertyApproval(published, true) || published.id !== binding.recordId || published.fields.Slug !== binding.slug) {
        throw new Error("Airtable did not confirm the expected listing and public address");
      }
      publicConfirmed = true;

      const state = buildFirstPublicationUpdate({ current: submission, computedSlug: binding.slug, now });
      let query = supabaseAdmin.from("properties").update({
        ...state,
        publication_external_record_id: binding.recordId,
        quietly_open_to_offers: false,
      }).eq("id", submission.id).eq("title", submission.title);
      query = submission.owner_id == null ? query.is("owner_id", null) : query.eq("owner_id", submission.owner_id);
      if (Object.hasOwn(submission, "archived_at")) query = query.is("archived_at", null);
      if (submission.creation_source === "pdf_assisted") query = query.eq("pdf_verified", true);

      privateSaveStarted = true;
      const { data: saved, error } = await matchPublicationSnapshot(query, submission).select("id").maybeSingle();
      if (error || !saved) throw error || new Error("The draft changed before approval could be recorded");
    } catch (error) {
      console.error("[ADMIN APPROVE] Publication did not complete:", error?.code || error?.name);
      let compensated = false;
      let publicCachePending = false;
      const bindingConflict = !privateSaveStarted && isAirtableRecordBindingError(error);
      const activationUnattempted = !activationStarted || bindingConflict ||
        (!privateSaveStarted && isAirtableRecordNotFoundError(error));
      try {
        if (staged && activationUnattempted) {
          await deletePropertyById(apiKey, baseId, binding.recordId);
          compensated = true;
        } else if (binding && !activationUnattempted) {
          const result = privateSaveStarted || !staged ? await loadProperty(submission.id) : null;
          const current = result?.data;
          if (current && isMarketVisible(current) && !isStaffSuspended(current) && !isPermanentlyRemoved(current) &&
              current.canonical_slug === binding.slug && current.publication_external_record_id === binding.recordId) {
            if (publicConfirmed) {
              const publicCachePending = await refreshCatalogue();
              return NextResponse.json({ success: true, airtableId: binding.recordId, publicCachePending });
            }
          } else if (!result?.error) {
            await unpublishPropertyByRecordId(apiKey, baseId, binding.recordId);
            publicCachePending = await refreshCatalogue([binding]);
            if (staged && current?.publication_external_record_id !== binding.recordId) {
              await deletePropertyById(apiKey, baseId, binding.recordId);
            }
            compensated = true;
          }
        }
      } catch {
        // Reconciliation is required if either provider cannot confirm recovery.
      }
      await recordSystemEvent({
        event: EVENTS.AIRTABLE_PUBLISH_FAILED,
        severity: compensated ? "warning" : "error",
        subjectTable: "properties",
        subjectId: submission.id,
        summary: "Staff publication did not complete",
        detail: { staffId: auth.userId, recordId: binding?.recordId || null, compensated, publicCachePending },
      });
      return NextResponse.json({
        error: bindingConflict && compensated
          ? "This public address belongs to another listing"
          : compensated
          ? "Approval could not be saved. The listing is off the public catalogue."
          : "Approval could not be confirmed. Review the listing in reconciliation before retrying.",
        retryable: compensated,
        reconciliationRequired: !compensated,
        publicCachePending,
      }, { status: bindingConflict && compensated ? 409 : 502 });
    }

    const publicCachePending = await refreshCatalogue();
    return NextResponse.json({ success: true, airtableId: binding.recordId, publicCachePending });
  } catch (error) {
    console.error("[ADMIN APPROVE] Request failed:", error?.code || error?.name);
    return NextResponse.json({ error: sanitizeError(error, "Could not approve the listing.") }, { status: 500 });
  }
}
