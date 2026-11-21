const PROTECTED_STATES = new Set(["staff_suspended", "suspended", "permanently_removed"]);
export const STAFF_DRAFT_STATES = ["draft", "pending", "submitted", "draft_ready_for_review"];

export function isProtectedProperty(property) {
  return Boolean(property.permanently_removed_at) ||
    [property.pipeline_status, property.lifecycle_state, property.moderation_status].some((state) => PROTECTED_STATES.has(state));
}

export function isLiveProperty(property) {
  return property.pipeline_status === "approved" && !isProtectedProperty(property);
}

export function isStaffEditableDraft(property) {
  return STAFF_DRAFT_STATES.includes(property.pipeline_status) &&
    !isProtectedProperty(property) && !property.archived_at &&
    !["live", "off_market"].includes(property.lifecycle_state) &&
    !["approved", "archived"].includes(property.moderation_status);
}

export function canSynthesizeListing(property) {
  return isStaffEditableDraft(property) &&
    !property.published_at && !property.canonical_slug && !property.publication_external_record_id &&
    (property.creation_source !== "pdf_assisted" || (!property.pdf_verified && property.pipeline_status === "pending"));
}

export function getPropertyBinding(property) {
  const slug = property.canonical_slug;
  const recordId = property.publication_external_record_id;
  return typeof slug === "string" && slug.trim() && /^rec[A-Za-z0-9]+$/.test(recordId || "")
    ? { slug, recordId }
    : null;
}

export function matchPropertySnapshot(query, property, additional = []) {
  for (const column of [
    "owner_id", "title", "canonical_slug", "publication_external_record_id", "pipeline_status",
    "moderation_status", "lifecycle_state", "archived_at", "published_at", "permanently_removed_at",
    ...additional,
  ]) {
    if (!Object.hasOwn(property, column)) continue;
    query = property[column] == null ? query.is(column, null) : query.eq(column, property[column]);
  }
  return query;
}

export async function approvePropertyPublication({ admin, property, provider, recordIntent, isReserved, now = new Date().toISOString() }) {
  if (!isStaffEditableDraft(property)) {
    return { error: "Only an active draft can be approved. Refresh the queue." };
  }
  if (!Object.hasOwn(property, "publication_external_record_id")) {
    return { error: "Publication identity storage is unavailable." };
  }

  let binding = getPropertyBinding(property);
  if ((property.canonical_slug || property.canonical_slug_locked_at || property.published_at ||
      property.publication_external_record_id) && !binding) {
    return { error: "This listing requires publication identity reconciliation." };
  }

  try {
    await recordIntent();
  } catch {
    return { error: "Could not record the approval in the staff audit." };
  }

  let staged = false;
  let activationAttempted = false;
  let activated = false;
  let privateWriteAttempted = false;
  const listing = { ...property, last_verified_date: property.last_verified_date || now };
  const finish = async () => ({ success: true, ...binding, publicCachePending: !(await provider.refresh()).purged });

  try {
    if (!binding) {
      binding = await provider.stage(listing);
      staged = true;
      if (await isReserved(admin, binding.slug, property.id)) {
        await provider.removeDraft(binding.recordId);
        return { error: "This public address is reserved." };
      }
    }

    activationAttempted = true;
    await provider.activate(binding, listing);
    activated = true;
    const query = admin.from("properties").update({
      moderation_status: "approved",
      pipeline_status: "approved",
      lifecycle_state: "live",
      slug: binding.slug,
      canonical_slug: binding.slug,
      canonical_slug_locked_at: property.canonical_slug_locked_at || now,
      published_at: property.published_at || now,
      last_verified_date: listing.last_verified_date,
      publication_external_record_id: binding.recordId,
      quietly_open_to_offers: false,
      rejection_reason: null,
    }).eq("id", property.id);
    const guardedColumns = property.creation_source === "pdf_assisted" ? ["creation_source", "pdf_verified"] : ["creation_source"];
    privateWriteAttempted = true;
    const { data, error } = await matchPropertySnapshot(query, property, guardedColumns).select("id").maybeSingle();
    if (error || data?.id !== property.id) throw new Error("The draft changed before it could be saved");
  } catch (error) {
    let compensated = false;
    let publicCachePending = false;
    try {
      const bindingConflict = error?.code === "AIRTABLE_PUBLICATION_BINDING";
      if (staged && (!activationAttempted || bindingConflict)) {
        await provider.removeDraft(binding.recordId);
        compensated = true;
      } else if (binding && activationAttempted && !bindingConflict) {
        const result = privateWriteAttempted || !staged
          ? await admin.from("properties").select("*").eq("id", property.id).maybeSingle()
          : null;
        const current = result?.data;
        if (current && isLiveProperty(current) &&
            current.canonical_slug === binding.slug && current.publication_external_record_id === binding.recordId) {
          if (activated) return finish();
        } else if (!result?.error) {
          await provider.withdraw(binding.recordId);
          publicCachePending = !(await provider.refresh([binding])).purged;
          if (staged && current?.publication_external_record_id !== binding.recordId) await provider.removeDraft(binding.recordId);
          compensated = true;
        }
      }
    } catch {
      // A failed recovery remains available for staff reconciliation.
    }
    return {
      error: compensated
        ? "Approval did not complete. The listing is off the public catalogue."
        : "Approval could not be confirmed. Review the listing in reconciliation before retrying.",
      recovered: compensated,
      reconciliationRequired: !compensated,
      recordId: binding?.recordId || null,
      publicCachePending,
    };
  }
  return finish();
}
