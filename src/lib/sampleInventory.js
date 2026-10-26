export const SAMPLE_PROPERTY_SLUGS = Object.freeze([
  "corner-unit-poblacion-strip",
  "cyber-sigma-tower-3",
  "one-ecom-center",
  "sea-breeze-loft-boracay-station-2",
  "the-foundry-warehouse-district-bgc",
  "the-meridian-hotel-cebu-it-park",
  "the-ridgeline-at-capitol-commons",
]);

/**
 * Flagship Super Sample Vault Demonstration Media.
 * Enriches sample listings (e.g. The Ridgeline at Capitol Commons) with a complete
 * spatial vault suite (3D Luma map, 360 Matterport walkthrough, drone heatmap,
 * architectural floor plans and blueprints) to demonstrate ScoutIt's full spatial capabilities.
 */
export const SUPER_SAMPLE_VAULT_DATA = Object.freeze({
  "the-ridgeline-at-capitol-commons": Object.freeze({
    luma3dMapUrl: "https://lumalabs.ai/embed/b02c8172-e1ad-4de2-bc57-2e1bf35c5cbf",
    matterportTourUrl: "https://my.matterport.com/show/?m=JGPnGQLNjQF",
    virtual_tour_url: "https://my.matterport.com/show/?m=JGPnGQLNjQF",
    droneHeatmapUrl: "https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1600&q=70",
    floorPlans: Object.freeze([
      Object.freeze({
        name: "Level 42 Penthouse · Architectural Floor Plan",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "Sky Terrace & Infinity Lap Pool Layout",
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "MEP Conduit, Electrical & HVAC Engineering Plan (PDF)",
        url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80#layout.pdf",
        type: "application/pdf",
      }),
      Object.freeze({
        name: "Structural Load & Seismic Isolation Schedule (PDF)",
        url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1600&q=80#specs.pdf",
        type: "application/pdf",
      }),
    ]),
  }),
  "cyber-sigma-tower-3": Object.freeze({
    luma3dMapUrl: "https://lumalabs.ai/embed/b02c8172-e1ad-4de2-bc57-2e1bf35c5cbf",
    matterportTourUrl: "https://my.matterport.com/show/?m=JGPnGQLNjQF",
    virtual_tour_url: "https://my.matterport.com/show/?m=JGPnGQLNjQF",
    droneHeatmapUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    floorPlans: Object.freeze([
      Object.freeze({
        name: "Level 14 East Wing · Fitted BPO Floor Plate (750 sqm)",
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "Level 22 High-Zone · Contiguous Core & Shell Layout (1,500 sqm)",
        url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "MEP Chilled-Water AHU & Data Riser Engineering Blueprint (PDF)",
        url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80#layout.pdf",
        type: "application/pdf",
      }),
      Object.freeze({
        name: "500kg/sqm Floor Loading & Raised-Floor Power Distribution Schedule (PDF)",
        url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1600&q=80#specs.pdf",
        type: "application/pdf",
      }),
    ]),
  }),
});

export function isSamplePropertySlug(slug) {
  return SAMPLE_PROPERTY_SLUGS.includes(String(slug || "").trim().toLowerCase());
}

export function normalizeSampleBundle(bundle) {
  if (!bundle) return bundle;
  return {
    ...bundle,
    properties: (bundle.properties || []).map((property) => {
      const isSample = property.is_sample === true || isSamplePropertySlug(property.slug);
      const sampleVault = isSample ? SUPER_SAMPLE_VAULT_DATA[property.slug] : null;

      if (!sampleVault && property.is_sample === isSample) return property;

      return {
        ...property,
        is_sample: isSample,
        ...(sampleVault && {
          luma3dMapUrl: property.luma3dMapUrl || sampleVault.luma3dMapUrl,
          matterportTourUrl: property.matterportTourUrl || sampleVault.matterportTourUrl,
          virtual_tour_url: property.virtual_tour_url || sampleVault.virtual_tour_url,
          droneHeatmapUrl: property.droneHeatmapUrl || sampleVault.droneHeatmapUrl,
          floorPlans: property.floorPlans?.length ? property.floorPlans : sampleVault.floorPlans,
        }),
      };
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
