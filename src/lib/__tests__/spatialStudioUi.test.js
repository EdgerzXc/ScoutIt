import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("A-196 · Spatial Studio UI Components & Source Contracts", () => {
  const readSrc = (relPath) => readFileSync(join(process.cwd(), relPath), "utf8");

  describe("SpatialStudioRequestModal contract", () => {
    const src = readSrc("src/components/dashboard/SpatialStudioRequestModal.js");

    it("wires accessibility useModalDialog hook", () => {
      expect(src).toContain("useModalDialog");
      expect(src).toContain('role="dialog"');
      expect(src).toContain('aria-modal="true"');
      expect(src).toContain('aria-labelledby="spatial-modal-title"');
    });

    it("includes Pre-Flight Style & Palette Selector (Pillar 1)", () => {
      expect(src).toContain("SPATIAL_STYLE_PRESETS");
      expect(src).toContain("Select Aesthetic Moodboard Preset");
      expect(src).toContain("minimalist_organic");
      expect(src).toContain("selectedPreset");
    });

    it("displays subscription entitlement and Connect pricing logic", () => {
      expect(src).toContain("resolveSpatialEntitlement");
      expect(src).toContain("Covered by Plan");
      expect(src).toContain("3 Connects");
    });

    it("submits to /api/spatial/request", () => {
      expect(src).toContain('fetch("/api/spatial/request"');
      expect(src).toContain("stylePreset: selectedPreset");
    });
  });

  describe("MaterialSwapperToolbar contract", () => {
    const src = readSrc("src/components/property/MaterialSwapperToolbar.js");

    it("includes the 3 interactive in-viewer material categories (Pillar 2)", () => {
      expect(src).toContain("MATERIAL_SWAP_OPTIONS");
      expect(src).toContain("Flooring");
      expect(src).toContain("Partitions");
      expect(src).toContain("Lighting Mood");
      expect(src).toContain("Zero-Wait Preview");
    });

    it("includes express revision button with 4-12h SLA badge (Pillar 3)", () => {
      expect(src).toContain("Request Studio Tweak");
      expect(src).toContain("4–12h SLA");
      expect(src).toContain("onRequestRevision");
    });
  });

  describe("SpatialStudioRevisionModal contract", () => {
    const src = readSrc("src/components/property/SpatialStudioRevisionModal.js");

    it("wires accessibility useModalDialog hook", () => {
      expect(src).toContain("useModalDialog");
      expect(src).toContain('role="dialog"');
      expect(src).toContain('aria-modal="true"');
    });

    it("includes targeted elements selection and express turnaround SLA", () => {
      expect(src).toContain("REVISION_ELEMENTS");
      expect(src).toContain("SPATIAL_SLA_HOURS");
      expect(src).toContain("Express {SPATIAL_SLA_HOURS.express}h SLA");
      expect(src).toContain("4 to 12 Hours");
      expect(src).toContain('/api/spatial/revision');
    });
  });

  describe("SpatialVaultWidget & OwnerMode Integration", () => {
    const vaultSrc = readSrc("src/components/property/SpatialVaultWidget.js");
    const ownerSrc = readSrc("src/components/dashboard/OwnerMode.js");

    it("mounts MaterialSwapperToolbar and SpatialStudioRevisionModal in SpatialVaultWidget", () => {
      expect(vaultSrc).toContain("MaterialSwapperToolbar");
      expect(vaultSrc).toContain("SpatialStudioRevisionModal");
      expect(vaultSrc).toContain("DEFAULT_MATERIAL_CONFIG");
    });

    it("mounts SpatialStudioRequestModal and aesthetic moodboards in OwnerMode", () => {
      expect(ownerSrc).toContain("SpatialStudioRequestModal");
      expect(ownerSrc).toContain("SPATIAL_STYLE_PRESETS");
      expect(ownerSrc).toContain("3D Spatial Studio");
      expect(ownerSrc).toContain("/api/spatial/request");
    });
  });
});
