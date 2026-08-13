export const SAMPLE_PROPERTY_SLUGS = Object.freeze([
  "corner-unit-poblacion-strip",
  "cyber-sigma-tower-3",
  "one-ecom-center",
  "sea-breeze-loft-boracay-station-2",
  "the-foundry-warehouse-district-bgc",
  "the-meridian-hotel-cebu-it-park",
  "the-ridgeline-at-capitol-commons",
]);

export function isSamplePropertySlug(slug) {
  return SAMPLE_PROPERTY_SLUGS.includes(String(slug || "").trim().toLowerCase());
}

export function normalizeSampleBundle(bundle) {
  if (!bundle) return bundle;
  return {
    ...bundle,
    properties: (bundle.properties || []).map((property) => {
      const isSample = property.is_sample === true || isSamplePropertySlug(property.slug);
      return property.is_sample === isSample ? property : { ...property, is_sample: isSample };
    }),
  };
}

export function parseSampleRecipientAllowlist(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

export function validateSampleInquiryRecipients({ slug, recipientIds, allowlistValue }) {
  if (!isSamplePropertySlug(slug)) return { ok: true, sample: false };
  const allowlist = parseSampleRecipientAllowlist(allowlistValue);
  const recipients = [...new Set((recipientIds || []).filter(Boolean))];
  if (!allowlist.size || !recipients.length) {
    return { ok: false, sample: true, reason: "sample_routing_unconfigured" };
  }
  if (recipients.some((recipientId) => !allowlist.has(recipientId))) {
    return { ok: false, sample: true, reason: "sample_recipient_not_allowlisted" };
  }
  return { ok: true, sample: true };
}
