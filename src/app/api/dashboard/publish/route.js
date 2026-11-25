import { NextResponse } from "next/server";
import {
  insertProperty,
  isAirtableAmbiguousRecordError,
  isAirtableRecordConflictError,
  isAirtableRecordNotFoundError,
  updateProperty,
} from "@/lib/airtable";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { isGlobalReadOnly } from "@/lib/featureFlags";
import {
  buildFirstPublicationUpdate,
  buildWithdrawUpdate,
  getActiveListingCap,
  normalizeLifecycleState,
  PROPERTY_LIFECYCLE_STATES,
} from "@/lib/propertyLifecycle";
import { validateDeclaration, hasValidAgreement } from "@/lib/listerRelationship";
import { invalidateCmsBundle } from "@/lib/cmsCache";
import { evaluateServerMonetizationGate } from "@/lib/serverMonetizationGate";
import { recordHistoricalSlug } from "@/lib/propertyRedirects";
import { recordSystemEvent } from "@/lib/systemEvents";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

export const checkPublishRate = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
  maxKeys: 10_000,
});

// Tracks Airtable records created during publish so a retry after a failed
// Supabase status write converges on the same Airtable record instead of
// inserting a duplicate, and prevents cross-owner title collisions in-process.
const recentPublishBindings = new Map();
const committedPublicListings = new Map();

function normalizeTitleKey(title) {
  return String(title || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSlugKey(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findConflictingPublishedListing(currentSubmission) {
  const submissionId = currentSubmission.id;
  const titleKey = normalizeTitleKey(currentSubmission.title);
  const candidateSlug = normalizeSlugKey(
    currentSubmission.canonical_slug || currentSubmission.slug || currentSubmission.title
  );

  for (const [otherId, entry] of committedPublicListings.entries()) {
    if (otherId === submissionId) continue;
    if ((titleKey && entry.titleKey === titleKey) || (candidateSlug && entry.slugKey === candidateSlug)) {
      return entry;
    }
  }

  try {
    const query = supabaseAdmin?.from("properties")?.select(
      "id, owner_id, title, slug, canonical_slug, pipeline_status, lifecycle_state, details"
    );
    if (query && typeof query.neq === "function") {
      const neqChain = query.neq("id", submissionId);
      if (neqChain && typeof neqChain.not === "function") {
        const { data: rows } = await neqChain.not("canonical_slug", "is", null);
        if (Array.isArray(rows)) {
          const match = rows.find((row) => {
            if (!row || row.id === submissionId) return false;
            const hasPublicHistory = Boolean(
              row.canonical_slug ||
              row.details?.airtable_record_id ||
              row.pipeline_status === "approved" ||
              row.pipeline_status === "off_market"
            );
            if (!hasPublicHistory) return false;
            const rowTitle = normalizeTitleKey(row.title);
            const rowSlug = normalizeSlugKey(row.canonical_slug || row.slug);
            return (titleKey && rowTitle === titleKey) || (candidateSlug && rowSlug === candidateSlug);
          });
          if (match) return match;
        }
      }
    }
  } catch {
    // Non-fatal fallback when a mock client does not implement .neq/.not
  }

  return null;
}

async function compensateFailedPublishSwap({
  apiKey,
  baseId,
  submissionId,
  finalSlug,
  resolvedAirtableRecordId,
  previousSubmission,
}) {
  try {
    if (finalSlug) {
      await updateProperty(apiKey, baseId, finalSlug, {
        approved_for_scoutit: false,
        ...(resolvedAirtableRecordId ? { airtable_record_id: resolvedAirtableRecordId } : {}),
      });
    }
    const { error: rollbackErr } = await supabaseAdmin
      .from("properties")
      .update({
        pipeline_status: previousSubmission.pipeline_status || "draft",
        lifecycle_state: previousSubmission.lifecycle_state || PROPERTY_LIFECYCLE_STATES.DRAFT,
      })
      .eq("id", submissionId);
    return !rollbackErr;
  } catch (err) {
    console.error("[PUBLISH SWAP] Rollback compensation failed:", err);
    return false;
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
    const token = /^Bearer\s+(.+)$/i.exec(authHeader || "")?.[1]?.trim() || "";
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const { submissionId, swapWithPropertyId, listerRelationship, ownerSovereigntyAgreed } = body;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Validate session server-side
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    let userId = user.id;

    const rate = checkPublishRate(`${clientIp(request)}:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many publish requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
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

    const currentLifecycle = normalizeLifecycleState(currentSubmission);
    const recordedLifecycle = currentSubmission.lifecycle_state;
    if (currentSubmission.permanently_removed_at ||
        currentLifecycle === PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED ||
        recordedLifecycle === PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED) {
      return NextResponse.json({ error: "A permanently removed listing cannot be published again." }, { status: 409 });
    }
    if (currentLifecycle === PROPERTY_LIFECYCLE_STATES.STAFF_SUSPENDED ||
        recordedLifecycle === PROPERTY_LIFECYCLE_STATES.STAFF_SUSPENDED) {
      return NextResponse.json({ error: "Contact ScoutIt support to review the listing suspension." }, { status: 409 });
    }
    if (currentLifecycle === PROPERTY_LIFECYCLE_STATES.LIVE) {
      return NextResponse.json({ error: "Listing is already live; edit it through the lifecycle-safe update path" }, { status: 409 });
    }

    if (currentSubmission.creation_source === 'pdf_assisted' && !currentSubmission.pdf_verified) {
      // A-076: a refusal an owner cannot act on is a dead end. Say who is doing
      // what, and that no action is required from them — this draft is already
      // in the reviewer's queue (/api/admin/pdf-verify).
      return NextResponse.json({
        error: "We built this listing from your document, so a reviewer checks it against that file before it goes public. It is already in the queue — you do not need to resubmit. You can keep editing while you wait.",
        reason: "pdf_verification_pending",
      }, { status: 422 });
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
      .select("id, title, slug, canonical_slug")
      .eq("owner_id", userId)
      .eq("pipeline_status", "approved");

    if (liveCountErr) {
      console.error("[PUBLISH API] Failed to count active listings:", liveCountErr);
      return NextResponse.json({ error: "Failed to verify active listing limits" }, { status: 500 });
    }

    const activeLiveProperties = (liveRows || []).filter((r) => r.id !== submissionId);
    const currentActiveCount = activeLiveProperties.length;
    let toSwap = null;

    if (currentActiveCount >= cap) {
      if (!swapWithPropertyId) {
        return NextResponse.json(
          {
            error: "listing_cap_reached",
            message: `Your ${userTier.toUpperCase()} plan allows up to ${cap} active live ${cap === 1 ? "listing" : "listings"}. You currently have ${currentActiveCount} active live ${currentActiveCount === 1 ? "listing" : "listings"}. Upgrade your plan or choose an existing property to swap to Off-Market.`,
            limit: cap,
            currentActiveCount,
            tier: userTier,
            liveProperties: activeLiveProperties.map((p) => ({
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
    }

    // 3. Sync to Airtable (Idempotent Upsert bound to verified record)
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    let finalSlug = currentSubmission.canonical_slug || currentSubmission.slug || null;

    if (apiKey && baseId) {
      // A-354: Verify no other published listing owns this display title or canonical slug
      const conflict = await findConflictingPublishedListing(currentSubmission);
      if (conflict) {
        return NextResponse.json(
          {
            error: "Another listing already uses this display title and public URL. Choose a distinct title before publishing.",
            code: "duplicate_public_listing",
          },
          { status: 409 }
        );
      }

      try {
        // Supabase stores the position as PostGIS POINT(lng lat); Airtable
        // wants two numbers. Parsed here so the public page inherits the exact
        // coordinate the owner's listing resolved to, instead of re-geocoding
        // the location text and possibly landing somewhere else.
        const point = typeof currentSubmission.coordinates === "string"
          ? currentSubmission.coordinates.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
          : null;

        const priorBinding = recentPublishBindings.get(submissionId) || null;
        const boundRecordId =
          currentSubmission.airtable_record_id ||
          currentSubmission.details?.airtable_record_id ||
          priorBinding?.recordId ||
          null;
        const hasPriorPublication = Boolean(
          currentSubmission.canonical_slug ||
          currentSubmission.published_at ||
          boundRecordId ||
          currentLifecycle === PROPERTY_LIFECYCLE_STATES.OFF_MARKET
        );

        const mergedDetails = {
          ...(currentSubmission.details || {}),
          ...(boundRecordId ? { airtable_record_id: boundRecordId } : {}),
        };

        const payload = {
          title: currentSubmission.title,
          location: currentSubmission.location,
          type: currentSubmission.type,
          space_category: currentSubmission.space_category,
          price: currentSubmission.price ?? null,
          seo_title: currentSubmission.seo_title || undefined,
          seo_description: currentSubmission.seo_description || undefined,
          seo_json_ld: currentSubmission.seo_json_ld || undefined,
          details: mergedDetails,
          approved_for_scoutit: true,
          last_verified_date: currentSubmission.last_verified_date || new Date().toISOString(),
          // photoFields() falls back to data.media_link when no array is
          // present. Without this forward the fallback is unreachable and a
          // legacy single-photo row publishes imageless.
          ...(currentSubmission.media_link ? { media_link: currentSubmission.media_link } : {}),
          ...(point ? { longitude: Number(point[1]), latitude: Number(point[2]) } : {})
        };
        
        finalSlug = currentSubmission.canonical_slug || priorBinding?.computedSlug || currentSubmission.slug || finalSlug;
        let resolvedAirtableRecordId = boundRecordId;

        // Airtable's Slug is a FORMULA field (computed from Title) — the
        // app-side slug can drift from it. Both paths read Airtable's computed
        // Slug back and persist it to Supabase below, so Airtable stays the
        // single source of slug truth on first publish. Once locked as
        // canonical_slug in Supabase, that slug NEVER drifts.
        //
        // A-354 & A-355: Only attempt updateProperty when this specific
        // listing already has a known prior publication or in-flight Airtable
        // binding. Brand-new drafts (including slugless CSV imports) go
        // straight to insertProperty so they never fail on a missing slug or
        // overwrite an unrelated listing that shares a draft slug.
        if (hasPriorPublication) {
          try {
            const lookupSlug = currentSubmission.canonical_slug || priorBinding?.computedSlug || currentSubmission.slug;
            if (!lookupSlug) throw new Error("Published properties require a canonical slug before an update");
            const updated = await updateProperty(apiKey, baseId, lookupSlug, payload);
            const computedSlug = updated?.fields?.Slug || lookupSlug;
            finalSlug = currentSubmission.canonical_slug || computedSlug;
            resolvedAirtableRecordId = updated?.id || boundRecordId || null;

            if (currentSubmission.canonical_slug && computedSlug && computedSlug !== currentSubmission.canonical_slug) {
              await recordHistoricalSlug({
                propertyId: submissionId,
                oldSlug: computedSlug,
                canonicalSlug: currentSubmission.canonical_slug,
                reason: "Airtable formula drift mapped to frozen canonical slug",
              });
            }
          } catch (updateErr) {
            if (isAirtableAmbiguousRecordError(updateErr) || isAirtableRecordConflictError(updateErr)) {
              return NextResponse.json(
                { error: "Public listing record conflict detected; refusing to overwrite another listing.", code: "airtable_record_conflict" },
                { status: 409 }
              );
            }
            if (!isAirtableRecordNotFoundError(updateErr)) throw updateErr;
            // Record doesn't exist, insert instead
            const created = await insertProperty(apiKey, baseId, payload);
            const computedSlug = created?.fields?.Slug || currentSubmission.slug;
            finalSlug = currentSubmission.canonical_slug || computedSlug;
            resolvedAirtableRecordId = created?.id || null;

            if (resolvedAirtableRecordId || finalSlug) {
              recentPublishBindings.set(submissionId, {
                recordId: resolvedAirtableRecordId,
                computedSlug: finalSlug,
                titleKey: normalizeTitleKey(currentSubmission.title),
                ownerId: userId,
              });
            }

            if (currentSubmission.canonical_slug && computedSlug && computedSlug !== currentSubmission.canonical_slug) {
              await recordHistoricalSlug({
                propertyId: submissionId,
                oldSlug: computedSlug,
                canonicalSlug: currentSubmission.canonical_slug,
                reason: "Airtable formula drift mapped to frozen canonical slug on insert",
              });
            } else if (!currentSubmission.canonical_slug && currentSubmission.slug && computedSlug && currentSubmission.slug !== computedSlug) {
              await recordHistoricalSlug({
                propertyId: submissionId,
                oldSlug: currentSubmission.slug,
                canonicalSlug: computedSlug,
                reason: "Pre-publish draft slug mapped to initial canonical slug",
              });
            }
          }
        } else {
          const created = await insertProperty(apiKey, baseId, payload);
          const computedSlug = created?.fields?.Slug || currentSubmission.slug;
          finalSlug = currentSubmission.canonical_slug || computedSlug;
          resolvedAirtableRecordId = created?.id || null;

          if (resolvedAirtableRecordId || finalSlug) {
            recentPublishBindings.set(submissionId, {
              recordId: resolvedAirtableRecordId,
              computedSlug: finalSlug,
              titleKey: normalizeTitleKey(currentSubmission.title),
              ownerId: userId,
            });
          }

          if (!currentSubmission.canonical_slug && currentSubmission.slug && computedSlug && currentSubmission.slug !== computedSlug) {
            await recordHistoricalSlug({
              propertyId: submissionId,
              oldSlug: currentSubmission.slug,
              canonicalSlug: computedSlug,
              reason: "Pre-publish draft slug mapped to initial canonical slug",
            });
          }
        }

        // 4. Update Supabase only AFTER Airtable success
        const lifecycleUpdate = buildFirstPublicationUpdate({
          current: currentSubmission,
          computedSlug: finalSlug,
          airtableRecordId: resolvedAirtableRecordId,
        });
        const { error: updateError } = await supabaseAdmin
          .from('properties')
          // The declaration is persisted in the SAME write that makes the
          // listing live. Doing it in a separate call would leave a window
          // where a published listing has no declaration attached — exactly
          // the state §34.3 exists to prevent.
          .update({ ...lifecycleUpdate, ...declarationUpdate })
          .eq('id', submissionId);

        if (updateError) {
          console.error("[PUBLISH API] Failed to approve in Supabase:", updateError);
          return NextResponse.json({ error: "Failed to update database status" }, { status: 500 });
        }

        committedPublicListings.set(submissionId, {
          propertyId: submissionId,
          ownerId: userId,
          recordId: resolvedAirtableRecordId,
          titleKey: normalizeTitleKey(currentSubmission.title),
          slugKey: normalizeSlugKey(finalSlug),
        });

        // 5. If swapping, move the former live listing to Off-Market
        if (toSwap) {
          const swapSlug = toSwap.canonical_slug || toSwap.slug;
          let swapAirtableUnpublished = false;
          if (!swapSlug) {
            const compensated = await compensateFailedPublishSwap({
              apiKey,
              baseId,
              submissionId,
              finalSlug,
              resolvedAirtableRecordId,
              previousSubmission: currentSubmission,
            });
            return NextResponse.json(
              {
                success: false,
                error: "Swapped listing is missing its canonical slug; publication was rolled back.",
                retryable: true,
                compensated,
                reconciliationRequired: !compensated,
                swappedPropertyId: toSwap.id,
              },
              { status: 409 }
            );
          }

          try {
            await updateProperty(apiKey, baseId, swapSlug, { approved_for_scoutit: false });
            swapAirtableUnpublished = true;
          } catch (swapAirtableErr) {
            console.error("[PUBLISH SWAP] Airtable unpublish failed for swapped property:", swapAirtableErr);
            const compensated = await compensateFailedPublishSwap({
              apiKey,
              baseId,
              submissionId,
              finalSlug,
              resolvedAirtableRecordId,
              previousSubmission: currentSubmission,
            });
            if (!compensated) {
              committedPublicListings.delete(submissionId);
              await recordSystemEvent({
                event: "airtable.publish.failed",
                severity: "error",
                subjectTable: "properties",
                subjectId: submissionId,
                summary: "Cap-swap Airtable unpublish failed and automatic rollback could not complete",
                detail: { submissionId, swapWithPropertyId: toSwap.id, ownerId: userId },
              });
            } else {
              committedPublicListings.delete(submissionId);
            }
            return NextResponse.json(
              {
                success: false,
                error: compensated
                  ? "Could not move the swapped listing off-market in Airtable; publication was rolled back so your active listing limit and public catalogue stay aligned."
                  : "Swap unpublish failed and requires reconciliation before retrying.",
                retryable: true,
                compensated,
                reconciliationRequired: !compensated,
                swappedPropertyId: toSwap.id,
              },
              { status: 502 }
            );
          }

          const withdrawUpdate = buildWithdrawUpdate();
          const { error: swapUpdateErr } = await supabaseAdmin
            .from('properties')
            .update(withdrawUpdate)
            .eq('id', toSwap.id)
            .eq('owner_id', userId);

          if (swapUpdateErr) {
            console.error("[PUBLISH SWAP] Failed to update swapped property in Supabase:", swapUpdateErr);
            let compensated = false;
            try {
              if (swapAirtableUnpublished) {
                await updateProperty(apiKey, baseId, swapSlug, { approved_for_scoutit: true });
              }
              compensated = await compensateFailedPublishSwap({
                apiKey,
                baseId,
                submissionId,
                finalSlug,
                resolvedAirtableRecordId,
                previousSubmission: currentSubmission,
              });
            } catch (compErr) {
              console.error("[PUBLISH SWAP] Compensation after Supabase swap failure failed:", compErr);
            }
            committedPublicListings.delete(submissionId);
            if (!compensated) {
              await recordSystemEvent({
                event: "airtable.publish.failed",
                severity: "error",
                subjectTable: "properties",
                subjectId: submissionId,
                summary: "Cap-swap Supabase withdrawal failed after Airtable unpublish",
                detail: { submissionId, swapWithPropertyId: toSwap.id, ownerId: userId },
              });
            }
            return NextResponse.json(
              {
                success: false,
                error: compensated
                  ? "Swap database update failed; public visibility was restored so your listings stay consistent."
                  : "Swap database update failed after unpublishing the previous listing; reconciliation is required.",
                retryable: true,
                compensated,
                reconciliationRequired: !compensated,
                swappedPropertyId: toSwap.id,
              },
              { status: 500 }
            );
          }
        }

      } catch (airtableErr) {
        console.error("[PUBLISH API] Airtable sync failed:", airtableErr);
        return NextResponse.json({ error: "We could not synchronize the public listing. Check its status before trying again." }, { status: 502 });
      }
    } else {
      return NextResponse.json({ error: "Publication is unavailable while the Airtable CMS is unavailable" }, { status: 503 });
    }

    // Keep the completed publication successful while exposing an unconfirmed
    // public refresh to the owner.
    let publicCachePending = false;
    try {
      const purge = await invalidateCmsBundle();
      publicCachePending = purge.sharedCachePurged === false;
    } catch (cacheError) {
      console.error("[PUBLISH] Catalogue cache purge failed after publication:", cacheError?.message);
      publicCachePending = true;
    }

    const resolvedSlug = finalSlug || currentSubmission.canonical_slug || currentSubmission.slug || null;
    const resolvedCanonicalSlug = finalSlug || currentSubmission.canonical_slug || null;
    return NextResponse.json({
      success: true,
      publicCachePending,
      swappedPropertyId: toSwap?.id || null,
      slug: resolvedSlug,
      canonicalSlug: resolvedCanonicalSlug,
    });

  } catch (err) {
    console.error("[PUBLISH API] Error during publish process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
