import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { insertProperty, isAirtableRecordNotFoundError, updateProperty } from "@/lib/airtable";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { isGlobalReadOnly } from "@/lib/featureFlags";
import { buildFirstPublicationUpdate, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";
import { validateDeclaration, hasValidAgreement } from "@/lib/listerRelationship";

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
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const { submissionId, listerRelationship, ownerSovereigntyAgreed } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Validate session server-side
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    let userId = user.id;

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

    if (currentSubmission.creation_source === 'pdf_assisted' && !currentSubmission.pdf_verified) {
      return NextResponse.json({ error: "PDF-assisted listing drafts must be verified against source document before initial publication." }, { status: 422 });
    }

    const currentLifecycle = normalizeLifecycleState(currentSubmission);
    if (currentLifecycle === PROPERTY_LIFECYCLE_STATES.LIVE && currentSubmission.canonical_slug) {
      return NextResponse.json({ error: "Listing is already live; edit it through the lifecycle-safe update path" }, { status: 409 });
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

    // 3. Sync to Airtable (Idempotent Upsert)
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (apiKey && baseId) {
      try {
        console.log(`[PUBLISH API] Syncing slug ${currentSubmission.slug} to Airtable...`);
        const payload = {
          title: currentSubmission.title,
          location: currentSubmission.location,
          type: currentSubmission.type,
          space_category: currentSubmission.space_category,
          details: currentSubmission.details || {}
        };
        
        let finalSlug = currentSubmission.canonical_slug || currentSubmission.slug;

        // Attempt update first, fallback to insert. Airtable's Slug is a
        // FORMULA field (computed from Title) — the app-side slug can drift
        // from it (e.g. "E-Com" slugifies differently on each side, the exact
        // cause of the one-ecom-center Contact-flow break). Both paths read
        // Airtable's computed Slug back and persist it to Supabase below, so
        // Airtable stays the single source of slug truth on every publish.
        try {
          // If update succeeds, the record existed
          const lookupSlug = currentSubmission.canonical_slug || currentSubmission.slug;
          if (!lookupSlug) throw new Error("Published properties require a canonical slug before an update");
          const updated = await updateProperty(apiKey, baseId, lookupSlug, payload);
          finalSlug = updated?.fields?.Slug || lookupSlug;
        } catch (updateErr) {
          if (!isAirtableRecordNotFoundError(updateErr)) throw updateErr;
          // Record doesn't exist, insert instead
          const created = await insertProperty(apiKey, baseId, payload);
          finalSlug = created?.fields?.Slug || currentSubmission.slug;
        }

        // 4. Update Supabase only AFTER Airtable success
        const lifecycleUpdate = buildFirstPublicationUpdate({
          current: currentSubmission,
          computedSlug: finalSlug,
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

      } catch (airtableErr) {
        console.error("[PUBLISH API] Airtable sync failed:", airtableErr);
        return NextResponse.json({ error: "Airtable sync failed: " + airtableErr.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Publication is unavailable while the Airtable CMS is unavailable" }, { status: 503 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[PUBLISH API] Error during publish process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
