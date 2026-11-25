import { spatialEmbedUrl } from "./propertyMedia";

const SAMPLE_MATTERPORT_TOUR = "https://my.matterport.com/show/?m=xHWLdL3yKLQ";

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
 * spatial vault suite (3D Luma map, 360 Matterport walkthrough, heatmap example,
 * and reference images).
 */
export const SUPER_SAMPLE_VAULT_DATA = Object.freeze({
  "the-ridgeline-at-capitol-commons": Object.freeze({
    luma3dMapUrl: "https://lumalabs.ai/embed/b02c8172-e1ad-4de2-bc57-2e1bf35c5cbf",
    matterportTourUrl: SAMPLE_MATTERPORT_TOUR,
    virtual_tour_url: SAMPLE_MATTERPORT_TOUR,
    droneHeatmapUrl: "https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1600&q=70",
    floorPlans: Object.freeze([
      Object.freeze({
        name: "Residential exterior reference",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "Residential interior reference",
        url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "Residential design reference",
        url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "Architectural detail reference",
        url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
    ]),
  }),
  "cyber-sigma-tower-3": Object.freeze({
    luma3dMapUrl: "https://lumalabs.ai/embed/b02c8172-e1ad-4de2-bc57-2e1bf35c5cbf",
    matterportTourUrl: SAMPLE_MATTERPORT_TOUR,
    virtual_tour_url: SAMPLE_MATTERPORT_TOUR,
    droneHeatmapUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    floorPlans: Object.freeze([
      Object.freeze({
        name: "Fitted office reference",
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "Office layout reference",
        url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "Interior design reference",
        url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
      }),
      Object.freeze({
        name: "Architectural detail reference",
        url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1600&q=80",
        type: "image/jpeg",
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

      if (!sampleVault) {
        return property.is_sample === isSample ? property : { ...property, is_sample: isSample };
      }

      const tour = spatialEmbedUrl(property.matterportTourUrl, "matterport") ||
        spatialEmbedUrl(property.virtual_tour_url, "matterport") || sampleVault.matterportTourUrl;
      const floorPlans = Array.isArray(property.floorPlans) && property.floorPlans.length
        ? property.floorPlans.map((plan) => {
          const url = typeof plan?.url === "string" ? plan.url.split("#", 1)[0] : "";
          return sampleVault.floorPlans.find((sample) => sample.url === url) ?? plan;
        })
        : sampleVault.floorPlans;

      return {
        ...property,
        is_sample: isSample,
        luma3dMapUrl: property.luma3dMapUrl || sampleVault.luma3dMapUrl,
        matterportTourUrl: tour,
        virtual_tour_url: tour,
        droneHeatmapUrl: property.droneHeatmapUrl || sampleVault.droneHeatmapUrl,
        floorPlans,
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
