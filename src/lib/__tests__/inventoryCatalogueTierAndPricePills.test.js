import { describe, it, expect, vi } from "vitest";
import { formatUnitPrice } from "@/lib/unitMasterPage";
import { normalizeCount } from "@/lib/airtable";

describe("A-319: Count Normalisation at CMS Mapping", () => {
  it("normalises string count values ('2+', '3-4') instead of coercing to 0", () => {
    expect(normalizeCount("2+")).toBe(2);
    expect(normalizeCount("3-4")).toBe(3);
    expect(normalizeCount("10 rooms")).toBe(10);
    expect(normalizeCount(4)).toBe(4);
    expect(normalizeCount(0)).toBe(0);
    expect(normalizeCount("0")).toBe(0);
    expect(normalizeCount("")).toBe(0);
    expect(normalizeCount(null)).toBe(0);
    expect(normalizeCount(undefined)).toBe(0);
  });
});

describe("A-319: Price Formatting Parity (Hero & Card Agreement)", () => {
  it("formats raw numeric price strings with peso symbol and thousands grouping", () => {
    expect(formatUnitPrice("150000000")).toBe("₱150,000,000");
    expect(formatUnitPrice("45000000")).toBe("₱45,000,000");
    expect(formatUnitPrice("250000")).toBe("₱250,000");
  });

  it("passes through pre-formatted prices and text without alteration", () => {
    expect(formatUnitPrice("₱85,000,000")).toBe("₱85,000,000");
    expect(formatUnitPrice("₱85k/mo")).toBe("₱85k/mo");
    expect(formatUnitPrice("Price on request")).toBe("Price on request");
    expect(formatUnitPrice("Upon Request")).toBe("Upon Request");
    expect(formatUnitPrice("")).toBe("");
    expect(formatUnitPrice(null)).toBe("");
  });
});

describe("A-319: Inventory Page Tier Getter & Provider Value", () => {
  it("provides getCurrentTier and catalogue in DashboardContext default and provider values", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.resolve(process.cwd(), "src/context/DashboardContext.js"),
      "utf8"
    );

    // Default context value
    expect(src).toContain("getCurrentTier: () => \"starry\"");
    expect(src).toContain("catalogue: []");

    // Provider export
    expect(src).toContain("getCurrentTier: useCallback(");
    expect(src).toContain("catalogue,");
  });

  it("Inventory inner page source code imports and safely resolves tier getter", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/dashboard/inventory/[id]/page.js"),
      "utf8"
    );

    expect(src).toContain("getCurrentTier");
    expect(src).toMatch(/getFallbackTier|tierGetter/);
    expect(src).toContain('const isPro = tierGetter ? tierGetter() !== "starry" : true');
  });
});

describe("A-319: Commercial Flow Pill Customization (Workstations & Office Rooms)", () => {
  it("CommercialFlow source code routes hero listed_price through formatUnitPrice", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/property/CommercialFlow.js"),
      "utf8"
    );

    // Hero price formatted via formatUnitPrice
    expect(src).toContain("formatUnitPrice(d.listed_price)");
    // Must not render raw unformatted d.listed_price in hero
    expect(src).not.toMatch(/>\{d\.listed_price\}<\/div>/);
  });

  it("ResidentialFlow source code routes hero listed_price through formatUnitPrice", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/property/ResidentialFlow.js"),
      "utf8"
    );

    expect(src).toContain("formatUnitPrice(d.listed_price)");
    expect(src).not.toMatch(/>\{d\.listed_price\}<\/div>/);
  });

  it("CommercialFlow replaces Bedrooms with Rooms or Workstations for offices", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/property/CommercialFlow.js"),
      "utf8"
    );

    // Checks office category detection
    expect(src).toContain('cat.includes("office")');
    // Pill label is "Rooms" for offices
    expect(src).toContain('pill1Label = "Rooms"');
    // Workstations pill label for commercial spaces with workstation capacity
    expect(src).toContain('pill1Label = "Workstations"');
    // Sidebar displays Total Rooms for offices rather than unconditional Total Bedrooms
    expect(src).toContain('isOffice ? "Total Rooms"');
  });
});

describe("A-319: Draft Survival Under Radius Search Contract", () => {
  it("DashboardContext searchByRadius retains un-geocoded owner drafts", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(
      path.resolve(process.cwd(), "src/context/DashboardContext.js"),
      "utf8"
    );

    // searchByRadius updates both catalogue and listings
    expect(src).toContain("setCatalogue(filtered)");
    // Preserves drafts in progress
    expect(src).toContain("l.status === 'draft' || l.pipelineStatus === 'draft' || !l.coordinates");
    expect(src).toContain("setListings(mergedListings)");
  });
});
