import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("A-222 Platform Logic Atomicity, Navigation Escape-Hatches & Layer 04 Cohesion", () => {
  describe("Phase 1: P0 Post-Spend Compensating Refund & Atomicity Contracts", () => {
    it("protects owner invite route (/api/dashboard/invite) with refund_connects_system_error and rollback", () => {
      const src = read("src/app/api/dashboard/invite/route.js");
      expect(src).toContain("refund_connects_system_error");
      expect(src).toContain("rollbackInviteSideEffects(dealData[0].id)");
      expect(src).toContain("p_staff_id: \"system\"");
      expect(src).toContain("Invitation delivery failed. Your Connect has been refunded.");
    });

    it("protects deal initiate route (/api/deals/initiate) with refund_connects_system_error and deal rollback", () => {
      const src = read("src/app/api/deals/initiate/route.js");
      expect(src).toContain("refund_connects_system_error");
      expect(src).toContain("p_staff_id: \"system\"");
      expect(src).toContain("Inquiry delivery failed. Your Connect has been refunded.");
      expect(src).toMatch(/deal_routing_recipients.*delete/);
      expect(src).toMatch(/deals.*delete/);
    });
  });

  describe("Phase 2: P1 Escape-Trap Remediation & Navigation Breadcrumbs", () => {
    it("restores universal navigation shell and back link on /contact", () => {
      const src = read("src/app/contact/page.js");
      expect(src).toContain("<Header />");
      expect(src).toContain("<Footer />");
      expect(src).toContain("← Back to Directory");
      expect(src).toContain('href="/property"');
    });

    it("binds keyboard Escape event listener on ComparisonMatrix modal", () => {
      const src = read("src/components/property/ComparisonMatrix.js");
      expect(src).toContain('e.key === "Escape"');
      expect(src).toContain('window.addEventListener("keydown", handleKeyDown)');
      expect(src).toContain('role="dialog"');
      expect(src).toContain('aria-modal="true"');
    });

    it("binds keyboard Escape and arrow listeners on UnitMasterPage photo lightbox", () => {
      const src = read("src/components/property/UnitMasterPage.js");
      expect(src).toContain('e.key === "Escape"');
      expect(src).toContain('e.key === "ArrowLeft"');
      expect(src).toContain('e.key === "ArrowRight"');
      expect(src).toContain('role="dialog"');
      expect(src).toContain('aria-label="Fullscreen photo viewer"');
    });

    it("renders contextual Layer 04 and Broker Roster breadcrumbs on /brokers/portal", () => {
      const src = read("src/components/brokers/BrokerDossierEditor.js");
      expect(src).toContain('href="/layer/crust"');
      expect(src).toContain("Layer 04 · The Crust");
      expect(src).toContain('href="/brokers"');
      expect(src).toContain("Broker Roster");
      expect(src).toContain("Private Dossier");
    });

    it("renders Layer 05 parent breadcrumb on /layer/mantle/tour", () => {
      const src = read("src/app/layer/mantle/tour/page.js");
      expect(src).toContain('href="/layer/mantle"');
      expect(src).toContain("← Layer 05 · Mantle");
    });

    it("renders profile return breadcrumb on /badges", () => {
      const src = read("src/app/badges/page.js");
      expect(src).toContain('href="/profile"');
      expect(src).toContain("← Back to Profile");
    });

    it("links System Flow Graph (/admin/flow) in admin console tab navigation", () => {
      const src = read("src/app/admin/page.js");
      expect(src).toContain('href="/admin/flow"');
      expect(src).toContain("System Flow Graph");
    });
  });

  describe("Phase 3: P2 Layer 04 PEP Service Dock & Radar Nomenclature", () => {
    it("standardizes Layer 04 service partners and vector icons in ResidentialFlow", () => {
      const src = read("src/components/property/ResidentialFlow.js");
      expect(src).not.toContain("🗺️");
      expect(src).not.toContain("🎨");
      expect(src).toContain("Layer 04.1");
      expect(src).toContain("Layer 04.2");
      expect(src).toContain("Layer 04.3");
      expect(src).toContain("Layer 04.4");
      expect(src).toContain("4 disciplines live");
      expect(src).toContain("Layer 04 · The Crust");
    });

    it("standardizes Layer 04 service partners and vector icons in CommercialFlow", () => {
      const src = read("src/components/property/CommercialFlow.js");
      expect(src).not.toContain("🗺️");
      expect(src).not.toContain("🎨");
      expect(src).not.toContain('icon:"???"');
      expect(src).not.toContain('icon:"??"');
      expect(src).toContain("Layer 04.1");
      expect(src).toContain("Layer 04.2");
      expect(src).toContain("Layer 04.3");
      expect(src).toContain("Layer 04.4");
      expect(src).toContain("4 disciplines live");
      expect(src).toContain("Layer 04 · The Crust");
    });

    it("disambiguates radar copy to multi-overlay GIS in mantle tour and platform-tour", () => {
      const tourSrc = read("src/app/layer/mantle/tour/page.js");
      const vanitySrc = read("src/app/platform-tour/page.js");
      expect(tourSrc).toContain("Multi-Overlay Spatial Radar & Elevation GIS");
      expect(tourSrc).not.toContain("10-Layer Space Radar");
      expect(vanitySrc).toContain("multi-overlay 3D spatial radar");
      expect(vanitySrc).not.toContain("10-layer 3D spatial radar");
    });
  });

  describe("Phase 4: P3 Mobile Viewport Units (100dvh)", () => {
    it("uses min-h-dvh in badges page and mantle tour page", () => {
      const badges = read("src/app/badges/page.js");
      const mantleTour = read("src/app/layer/mantle/tour/page.js");
      expect(badges).toContain("min-h-dvh");
      expect(mantleTour).toContain("min-h-dvh");
    });
  });
});
