import { describe, it, expect } from "vitest";
import {
  isSamplePropertySlug,
  normalizeSampleBundle,
  SUPER_SAMPLE_VAULT_DATA,
} from "@/lib/sampleInventory";
import {
  classifyPropertyMedia,
  spatialEmbedUrl,
  imageMediaUrl,
  safeFloorPlans,
} from "@/lib/propertyMedia";
import {
  stripPremiumFields,
  pickPremiumFields,
  findPremiumLeak,
} from "@/lib/premiumFields";

describe("Super Sample Vault Specification (Capitol Commons & Cyber Sigma Tower 3)", () => {
  const RESIDENTIAL_SLUG = "the-ridgeline-at-capitol-commons";
  const COMMERCIAL_SLUG = "cyber-sigma-tower-3";
  const SLUGS = [RESIDENTIAL_SLUG, COMMERCIAL_SLUG];

  it("identifies both properties as official sample slugs in the manifest", () => {
    SLUGS.forEach((slug) => {
      expect(isSamplePropertySlug(slug)).toBe(true);
      expect(SUPER_SAMPLE_VAULT_DATA[slug]).toBeDefined();
    });
  });

  it("contains all 4 supported media classes in both Super Sample manifests", () => {
    SLUGS.forEach((slug) => {
      const data = SUPER_SAMPLE_VAULT_DATA[slug];

      // 1. 3D Spatial Map (Luma)
      expect(classifyPropertyMedia(data.luma3dMapUrl).kind).toBe("luma");
      expect(spatialEmbedUrl(data.luma3dMapUrl, "luma")).toBe(data.luma3dMapUrl);

      // 2. 360° Walkthrough (Matterport)
      expect(classifyPropertyMedia(data.matterportTourUrl).kind).toBe("matterport");
      expect(spatialEmbedUrl(data.matterportTourUrl, "matterport")).toBe(data.matterportTourUrl);
      expect(data.virtual_tour_url).toBe(data.matterportTourUrl);

      // 3. Drone Heatmap
      expect(classifyPropertyMedia(data.droneHeatmapUrl).kind).toBe("image");
      expect(imageMediaUrl(data.droneHeatmapUrl)).toBe(data.droneHeatmapUrl);

      // 4. Floor Plans (4 items: 2 images, 2 architectural PDFs)
      const sanitizedPlans = safeFloorPlans(data.floorPlans);
      expect(sanitizedPlans).toHaveLength(4);
      expect(sanitizedPlans.filter((p) => p.type.startsWith("image/"))).toHaveLength(2);
      expect(sanitizedPlans.filter((p) => p.type === "application/pdf")).toHaveLength(2);
    });
  });

  it("enriches both samples in normalizeSampleBundle without overwriting existing data", () => {
    const rawBundle = {
      properties: [
        {
          id: "recZtZILIHNhOUfty",
          slug: RESIDENTIAL_SLUG,
          is_sample: true,
          droneHeatmapUrl: "https://images.unsplash.com/existing-heatmap.jpg",
          luma3dMapUrl: "",
          matterportTourUrl: "",
          floorPlans: [],
        },
        {
          id: "rec7fH6C0M8QELk9G",
          slug: COMMERCIAL_SLUG,
          is_sample: true,
          droneHeatmapUrl: "",
          luma3dMapUrl: "",
          matterportTourUrl: "",
          floorPlans: [],
        },
      ],
      source: "airtable",
    };

    const enriched = normalizeSampleBundle(rawBundle);
    const residential = enriched.properties[0];
    const commercial = enriched.properties[1];

    expect(residential.is_sample).toBe(true);
    expect(residential.droneHeatmapUrl).toBe("https://images.unsplash.com/existing-heatmap.jpg");
    expect(residential.luma3dMapUrl).toBe(SUPER_SAMPLE_VAULT_DATA[RESIDENTIAL_SLUG].luma3dMapUrl);
    expect(residential.matterportTourUrl).toBe(SUPER_SAMPLE_VAULT_DATA[RESIDENTIAL_SLUG].matterportTourUrl);
    expect(residential.floorPlans).toHaveLength(4);

    expect(commercial.is_sample).toBe(true);
    expect(commercial.droneHeatmapUrl).toBe(SUPER_SAMPLE_VAULT_DATA[COMMERCIAL_SLUG].droneHeatmapUrl);
    expect(commercial.luma3dMapUrl).toBe(SUPER_SAMPLE_VAULT_DATA[COMMERCIAL_SLUG].luma3dMapUrl);
    expect(commercial.matterportTourUrl).toBe(SUPER_SAMPLE_VAULT_DATA[COMMERCIAL_SLUG].matterportTourUrl);
    expect(commercial.floorPlans).toHaveLength(4);
  });

  it("enforces zero public leaks while advertising vault capability to starry users", () => {
    const rawBundle = {
      properties: [
        {
          id: "recZtZILIHNhOUfty",
          slug: RESIDENTIAL_SLUG,
          is_sample: true,
        },
        {
          id: "rec7fH6C0M8QELk9G",
          slug: COMMERCIAL_SLUG,
          is_sample: true,
        },
      ],
    };
    const enriched = normalizeSampleBundle(rawBundle);

    enriched.properties.forEach((unstripped) => {
      // Public / Starry view
      const stripped = stripPremiumFields(unstripped, "starry");

      // Strips URLs from public payload
      expect(stripped.luma3dMapUrl).toBe("");
      expect(stripped.matterportTourUrl).toBe("");
      expect(stripped.virtual_tour_url).toBe("");
      expect(stripped.droneHeatmapUrl).toBe("");
      expect(stripped.floorPlans).toEqual([]);

      // But flags vault as available and locked
      expect(stripped.premiumAvailable).toContain("vault");
      expect(stripped.lockedFeatures).toContain("vault");

      // Passed to security gate: zero leaks
      expect(findPremiumLeak([stripped])).toBeNull();
    });
  });

  it("entitled Cluster and Universe users unlock all spatial assets for both samples", () => {
    const rawBundle = {
      properties: [
        {
          id: "recZtZILIHNhOUfty",
          slug: RESIDENTIAL_SLUG,
          is_sample: true,
        },
        {
          id: "rec7fH6C0M8QELk9G",
          slug: COMMERCIAL_SLUG,
          is_sample: true,
        },
      ],
    };
    const enriched = normalizeSampleBundle(rawBundle);

    enriched.properties.forEach((unstripped) => {
      const slug = unstripped.slug;
      const clusterFields = pickPremiumFields(unstripped, "cluster");
      expect(clusterFields.luma3dMapUrl).toBe(SUPER_SAMPLE_VAULT_DATA[slug].luma3dMapUrl);
      expect(clusterFields.matterportTourUrl).toBe(SUPER_SAMPLE_VAULT_DATA[slug].matterportTourUrl);
      expect(clusterFields.droneHeatmapUrl).toBe(SUPER_SAMPLE_VAULT_DATA[slug].droneHeatmapUrl);
      expect(clusterFields.floorPlans).toHaveLength(4);

      const universeFields = pickPremiumFields(unstripped, "universe");
      expect(universeFields.luma3dMapUrl).toBe(SUPER_SAMPLE_VAULT_DATA[slug].luma3dMapUrl);
      expect(universeFields.floorPlans).toHaveLength(4);
    });
  });
});
