import { getPropertyBinding, isProtectedProperty } from "./propertyPublication.mjs";

export function isPropertyArchiveAuditAction(action) {
  return /^property\.(?:archive|unarchive|bulk_archive)(?:\.intent)?$/.test(action);
}

export async function changePropertyArchiveState({ property, archive, reason, now, unpublish, save }) {
  const { lifecycle_state: lifecycle, moderation_status: moderation, pipeline_status: pipeline } = property;
  if (isProtectedProperty(property)) {
    return { stage: "protected" };
  }
  if (!archive && moderation !== "archived") return { stage: "changed" };

  const live = pipeline === "approved" || (!pipeline && (lifecycle === "live" || moderation === "approved"));
  const wasPublished = live || property.canonical_slug || property.published_at || property.publication_external_record_id;
  let cachePending = false;
  if (wasPublished) {
    const binding = getPropertyBinding(property);
    if (!binding) return { stage: "reference" };
    try {
      const result = await unpublish(binding);
      if (result?.recordId !== binding.recordId) return { stage: "reference" };
      cachePending = result?.cache?.purged !== true;
    } catch {
      return { stage: "airtable" };
    }
  }

  if (archive && moderation === "archived" && pipeline === "archived" && lifecycle === "off_market" && property.quietly_open_to_offers !== true) {
    return { stage: "saved", cachePending };
  }
  try {
    const saved = await save({
      moderation_status: archive ? "archived" : "pending",
      pipeline_status: archive ? "archived" : "pending",
      lifecycle_state: archive ? "off_market" : "draft",
      archived_at: archive ? now : null,
      rejection_reason: archive ? reason : null,
      ...(archive && { quietly_open_to_offers: false }),
    });
    if (!saved) return { stage: "supabase", publicChanged: Boolean(wasPublished) };
  } catch {
    return { stage: "supabase", publicChanged: Boolean(wasPublished) };
  }
  return { stage: "saved", cachePending };
}
