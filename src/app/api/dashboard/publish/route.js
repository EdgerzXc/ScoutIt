import { NextResponse } from "next/server";
import { getVerifiedWorkspaceUser } from "@/lib/workspaceRequestAuth";
import {
  confirmsPropertyApproval, deletePropertyById, insertProperty, isAirtableRecordBindingError,
  isAirtableRecordNotFoundError, unpublishPropertyByRecordId, updateProperty,
} from "@/lib/airtable";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { isGlobalReadOnly } from "@/lib/featureFlags";
import {
  buildFirstPublicationUpdate,
  buildWithdrawUpdate,
  getActiveListingCap,
  isPublicationSyncPending,
  normalizeLifecycleState,
  PROPERTY_LIFECYCLE_STATES,
} from "@/lib/propertyLifecycle";
import { validateDeclaration, hasValidAgreement } from "@/lib/listerRelationship";
import { invalidateCmsBundle } from "@/lib/cmsCache";
import { evaluateServerMonetizationGate } from "@/lib/serverMonetizationGate";
import { getPdfPublicationBlock } from "@/lib/propertyPdfReview";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";
import { isReservedPublicationAddress } from "@/lib/publicationAddress";
import { parsePointToLatLng } from "@/lib/geoPoint.mjs";

async function saveOwnedPublicationState(snapshot, ownerId, updates) {
  let query = supabaseAdmin.from("properties").update(updates).eq("id", snapshot.id).eq("owner_id", ownerId);
  for (const column of ["canonical_slug", "publication_external_record_id", "pipeline_status", "lifecycle_state", "published_at", "withdrawn_at", "publication_sync_state"]) {
    if (column === "publication_sync_state" && !Object.hasOwn(snapshot, column)) continue;
    query = snapshot[column] == null ? query.is(column, null) : query.eq(column, snapshot[column]);
  }
  const { data, error } = await query.select("id").maybeSingle();
  return !error && data?.id === snapshot.id;
}

async function refreshPublicCatalogue(withdrawn) {
  try {
    const result = await invalidateCmsBundle({ withdrawn });
    return result.sharedCachePurged === false;
  } catch (cacheError) {
    console.error("[PUBLISH] Catalogue cache purge failed:", cacheError?.message);
    return true;
  }
}

export async function POST(request) {

  try {
    if (await isGlobalReadOnly()) {
      return NextResponse.json(
        { error: "System is in emergency maintenance read-only mode. Database writes are currently frozen." },
        { status: 423 }
      );
    }

    // 1. Extract token from Authorization header to prevent identity spoofing
    const authHeader = request.headers.get("Authorization");
    const token = /^Bearer\s+(.+)$/i.exec(authHeader || "")?.[1]?.trim();
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || Array.isArray(body) || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid publication request" }, { status: 400 });
    }
    const { submissionId, swapWithPropertyId, listerRelationship, ownerSovereigntyAgreed } = body;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Validate session server-side
    const { data: { user }, error: authError } = await getVerifiedWorkspaceUser(authClient, token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const userId = user.id;

    if (typeof submissionId !== "string" || !submissionId ||
        (swapWithPropertyId != null && typeof swapWithPropertyId !== "string")) {
      return NextResponse.json({ error: "Invalid listing selection" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // 2. Fetch the submission using Admin client and verify ownership
    const { data: currentSubmission, error: fetchError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !currentSubmission) {
      console.error("[PUBLISH API] Failed to fetch submission:", fetchError);
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (currentSubmission.owner_id !== userId) {
      return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    }

    const pdfBlock = getPdfPublicationBlock(currentSubmission);
    if (pdfBlock === "pdf_source_quarantined") {
      return NextResponse.json({
        error: "We could not process this PDF. Upload a new PDF or enter the listing manually.",
        reason: "pdf_source_quarantined",
      }, { status: 422 });
    }

    if (pdfBlock) {
      // A-076: a refusal an owner cannot act on is a dead end. Say who is doing
      // what, and that no action is required from them — this draft is already
      // in the reviewer's queue (/api/admin/pdf-verify).
      return NextResponse.json({
        error: "We built this listing from your document, so a reviewer checks it against that file before it goes public. It is already in the queue — you do not need to resubmit. You can keep editing while you wait.",
        reason: "pdf_verification_pending",
      }, { status: 422 });
    }

    const currentLifecycle = normalizeLifecycleState(currentSubmission);
    const protectedStates = [PROPERTY_LIFECYCLE_STATES.STAFF_SUSPENDED, PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED];
    if (currentSubmission.permanently_removed_at || isPublicationSyncPending(currentSubmission) ||
        protectedStates.includes(currentLifecycle) || protectedStates.includes(currentSubmission.lifecycle_state)) {
      return NextResponse.json({ error: "This listing cannot be published from its current lifecycle state." }, { status: 409 });
    }
    if (currentLifecycle === PROPERTY_LIFECYCLE_STATES.LIVE || currentSubmission.lifecycle_state === PROPERTY_LIFECYCLE_STATES.LIVE) {
      return NextResponse.json({ error: "Listing is already live; edit it through the lifecycle-safe update path" }, { status: 409 });
    }
    if (!Object.hasOwn(currentSubmission, "publication_external_record_id")) {
      return NextResponse.json({ error: "Verified publication records are not configured yet." }, { status: 503 });
    }
    if (Boolean(currentSubmission.canonical_slug) !== Boolean(currentSubmission.publication_external_record_id)) {
      return NextResponse.json({ error: "ScoutIt support needs to verify this listing’s public record before it can be republished." }, { status: 409 });
    }

    // ── LISTER RELATIONSHIP DECLARATION (§34.3 / NEW_IDEAS_2 §50) ──
    // RESA RA 9646: nobody publishes without stating their relationship to the
    // property and acknowledging that the title holder can reclaim it.
    //
    // Enforced at PUBLISH, not at draft creation — a draft harms nobody, and
    // blocking the first save would make people declare before they have even
    // decided to list. Publication is the moment the claim becomes public.
    //
    // Already-declared listings are not re-asked: re-publishing after an edit
    // should not demand the same acknowledgment twice.
    const alreadyDeclared =
      Boolean(currentSubmission.lister_relationship) &&
      hasValidAgreement(currentSubmission.owner_claim_agreed);

    let declarationUpdate = {};
    if (!alreadyDeclared) {
      const declaration = validateDeclaration(listerRelationship, ownerSovereigntyAgreed);
      if (!declaration.ok) {
        return NextResponse.json(
          { error: declaration.error, requiresDeclaration: true },
          { status: 422 },
        );
      }
      declarationUpdate = {
        lister_relationship: declaration.relationship,
        owner_claim_agreed: declaration.agreementRecord,
      };
    }

    // ── ACTIVE LISTING CAP ENFORCEMENT & SWAP HANDLING ──
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("subscription_tier, role, active_roles")
      .eq("id", userId)
      .maybeSingle();

    const userTier = profile?.subscription_tier || "starry";
    const userRole = profile?.role || "owner";
    const monetizationGate = await evaluateServerMonetizationGate({
      client: supabaseAdmin,
      userId,
      feature: "listing_quota",
      role: userRole,
      tier: userTier,
      swapWithPropertyId,
    });
    const cap = monetizationGate.isPilotZeroPaywall
      ? Infinity
      : getActiveListingCap({ tier: userTier, role: userRole });

    const { data: liveRows, error: liveCountErr } = await supabaseAdmin
      .from("properties")
      .select("id, title, slug, canonical_slug, publication_external_record_id, pipeline_status, lifecycle_state, published_at, withdrawn_at, publication_sync_state")
      .eq("owner_id", userId)
      .eq("pipeline_status", "approved");

    if (liveCountErr) {
      console.error("[PUBLISH API] Failed to count active listings:", liveCountErr);
      return NextResponse.json({ error: "Failed to verify active listing limits" }, { status: 500 });
    }

    const activeLiveProperties = (liveRows || []).filter((r) => r.id !== submissionId);
    const eligibleSwapTargets = activeLiveProperties.filter((row) => row.canonical_slug && row.publication_external_record_id && !isPublicationSyncPending(row));
    const currentActiveCount = activeLiveProperties.length;
    let toSwap = null;
    const withdrawn = [];

    if (currentActiveCount >= cap) {
      if (currentActiveCount > cap) {
        return NextResponse.json({ error: "Withdraw enough active listings to reach your plan limit before swapping." }, { status: 409 });
      }
      if (!swapWithPropertyId) {
        if (!eligibleSwapTargets.length) {
          return NextResponse.json({ error: "ScoutIt support needs to verify an active listing’s public record before you can swap it." }, { status: 409 });
        }
        return NextResponse.json(
          {
            error: "listing_cap_reached",
            message: `Your ${userTier.toUpperCase()} plan allows up to ${cap} active live ${cap === 1 ? "listing" : "listings"}. You currently have ${currentActiveCount} active live ${currentActiveCount === 1 ? "listing" : "listings"}. Upgrade your plan or choose an existing property to swap to Off-Market.`,
            limit: cap,
            currentActiveCount,
            tier: userTier,
            liveProperties: eligibleSwapTargets.map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.canonical_slug || p.slug,
            })),
          },
          { status: 409 }
        );
      }

      toSwap = activeLiveProperties.find((p) => p.id === swapWithPropertyId);
      if (!toSwap) {
        return NextResponse.json(
          { error: "Invalid swap selection: the selected property is not currently an active live listing owned by you." },
          { status: 400 }
        );
      }
      if (!toSwap.canonical_slug || !toSwap.publication_external_record_id || isPublicationSyncPending(toSwap)) {
        return NextResponse.json({ error: "ScoutIt support needs to verify the selected listing’s public record before it can be swapped." }, { status: 409 });
      }
    }


    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) {
      return NextResponse.json({ error: "Publication is unavailable while the Airtable CMS is unavailable" }, { status: 503 });
    }

    const canonicalSlug = currentSubmission.canonical_slug;
    const point = parsePointToLatLng(currentSubmission.coordinates);
    const now = new Date().toISOString();
    const payload = {
      location: currentSubmission.location,
      type: currentSubmission.type,
      space_category: currentSubmission.space_category,
      price: currentSubmission.price,
      details: currentSubmission.details || {},
      seo_title: currentSubmission.seo_title,
      seo_description: currentSubmission.seo_description,
      seo_json_ld: currentSubmission.seo_json_ld,
      last_verified_date: currentSubmission.last_verified_date || now,
      approved_for_scoutit: true,
      ...(currentSubmission.media_link ? { media_link: currentSubmission.media_link } : {}),
      ...(point ? { longitude: point.lng, latitude: point.lat } : {}),
    };

    let recordId = currentSubmission.publication_external_record_id;
    let finalSlug;
    let publishedSnapshot;
    let verifiedStagedDraft = false;
    async function publicationFailure(stage, error) {
      console.error("[PUBLISH] Could not complete publication stage:", stage, error?.message);
      let compensated = false;
      const bindingConflict = stage === "publish_public" && isAirtableRecordBindingError(error);
      const approvalWasUnattempted = stage === "prepare_public" || bindingConflict ||
        (stage === "publish_public" && isAirtableRecordNotFoundError(error));
      try {
        if (verifiedStagedDraft && approvalWasUnattempted) {
          await deletePropertyById(apiKey, baseId, recordId);
          compensated = true;
        } else if (recordId && (!canonicalSlug || publishedSnapshot)) {
          await unpublishPropertyByRecordId(apiKey, baseId, recordId);
          withdrawn.push({ slug: finalSlug, recordId });
          if (publishedSnapshot) {
            compensated = await saveOwnedPublicationState(publishedSnapshot, userId, {
              pipeline_status: currentSubmission.pipeline_status || "pending",
              lifecycle_state: currentSubmission.lifecycle_state || PROPERTY_LIFECYCLE_STATES.DRAFT,
              quietly_open_to_offers: currentSubmission.quietly_open_to_offers === true,
            });
          }
        }
      } catch (rollbackError) {
        console.error("[PUBLISH] Publication rollback needs reconciliation:", rollbackError?.message);
      }

      const publicCachePending = await refreshPublicCatalogue(withdrawn);
      const reconciliationRequired = !compensated || stage === "swap_private";
      await recordSystemEvent({
        event: EVENTS.AIRTABLE_PUBLISH_FAILED,
        severity: reconciliationRequired ? "error" : "warning",
        subjectTable: "properties",
        subjectId: submissionId,
        summary: "Owner publication did not complete",
        detail: { stage, submissionId, swapPropertyId: toSwap?.id || null, compensated, reconciliationRequired, publicCachePending },
      });

      let message = "Could not verify the publication. Check the listing status before trying again.";
      if (bindingConflict && compensated) {
        message = "This public address belongs to another listing. Choose a distinct listing title.";
      } else if (stage === "swap_public" && compensated) {
        message = "The replacement was rolled back. Check the former listing's public status and retry the swap.";
      } else if (stage === "swap_private" && compensated) {
        message = "Airtable confirmed removal of the former listing. Refresh your listings and retry the swap to reconcile the private status.";
      }
      return NextResponse.json({
        success: false,
        error: message,
        code: bindingConflict && compensated ? "PUBLICATION_ADDRESS_CONFLICT" : toSwap ? "SWAP_RECONCILIATION_REQUIRED" : "PUBLICATION_RECONCILIATION_REQUIRED",
        compensated,
        reconciliationRequired,
        retryable: compensated,
        publicCachePending,
      }, { status: bindingConflict && compensated ? 409 : 502 });
    }

    finalSlug = canonicalSlug;
    if (!canonicalSlug) {
      try {
        const draft = await insertProperty(apiKey, baseId, {
          ...payload, title: currentSubmission.title, approved_for_scoutit: false,
        });
        recordId = draft?.id;
        finalSlug = draft?.fields?.Slug;
        if (!confirmsPropertyApproval(draft, false) || typeof finalSlug !== "string" || !finalSlug.trim()) {
          throw new Error("Airtable did not confirm the private listing and its public address");
        }
        verifiedStagedDraft = true;
        if (await isReservedPublicationAddress(supabaseAdmin, finalSlug, submissionId)) {
          await deletePropertyById(apiKey, baseId, recordId);
          return NextResponse.json({ error: "This public address is reserved. Choose a distinct listing title." }, { status: 409 });
        }
      } catch (error) {
        return publicationFailure("prepare_public", error);
      }
    }

    try {
      const record = await updateProperty(apiKey, baseId, finalSlug, { ...payload, expectedRecordId: recordId });
      if (!confirmsPropertyApproval(record, true) || record.id !== recordId || record.fields.Slug !== finalSlug) {
        throw new Error("Airtable did not confirm approval at the expected public address");
      }
    } catch (error) {
      return publicationFailure("publish_public", error);
    }

    const lifecycleUpdate = buildFirstPublicationUpdate({ current: currentSubmission, computedSlug: finalSlug, now });
    const savedState = { ...lifecycleUpdate, ...declarationUpdate, publication_external_record_id: recordId, quietly_open_to_offers: false };
    try {
      if (!await saveOwnedPublicationState(currentSubmission, userId, savedState)) {
        throw new Error("The private listing changed before publication could be saved");
      }
      publishedSnapshot = { ...currentSubmission, ...savedState };
    } catch (error) {
      return publicationFailure("publish_private", error);
    }

    if (toSwap) {
      const swapSlug = toSwap.canonical_slug;
      try {
        const former = await updateProperty(apiKey, baseId, swapSlug, { approved_for_scoutit: false, expectedRecordId: toSwap.publication_external_record_id });
        if (!confirmsPropertyApproval(former, false) || former.id !== toSwap.publication_external_record_id) {
          throw new Error("Airtable did not confirm the former listing was unpublished");
        }
        withdrawn.push({ slug: swapSlug, recordId: former.id });
      } catch (error) {
        return publicationFailure("swap_public", error);
      }

      try {
        const withdrawUpdate = buildWithdrawUpdate();
        if (!await saveOwnedPublicationState(toSwap, userId, withdrawUpdate)) {
          throw new Error("The former listing changed before withdrawal could be saved");
        }
      } catch (error) {
        return publicationFailure("swap_private", error);
      }
    }

    const publicCachePending = await refreshPublicCatalogue(withdrawn);
    return NextResponse.json({ success: true, publicCachePending, swappedPropertyId: toSwap?.id || null });

  } catch (err) {
    console.error("[PUBLISH API] Error during publish process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
