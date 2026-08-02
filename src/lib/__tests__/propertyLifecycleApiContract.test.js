import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("LR-01 API safety contracts", () => {
  it("withdraw route unpublishes Airtable before retaining the Supabase row", () => {
    const route = read("src/app/api/dashboard/archive/route.js");
    expect(route).toContain("approved_for_scoutit: false");
    expect(route).toContain("property_lifecycle_events");
    expect(route).toContain("retryable: true");
    expect(route).not.toContain(".delete()");
  });

  it("owner removal route never calls a physical delete", () => {
    const route = read("src/app/api/dashboard/delete/route.js");
    expect(route).toContain("confirmPermanentRemoval");
    expect(route).toContain("hasRecentPasswordAuthentication");
    expect(route).toContain("retained: true");
    expect(route).not.toContain("deleteProperty");
    expect(route).not.toContain(".delete()");
  });

  it("off-market contact is server-gated", () => {
    const route = read("src/app/api/deals/initiate/route.js");
    expect(route).toContain("canContactProperty");
    expect(route).toContain("quietly_open_to_offers");
    expect(route).toContain("Property is not available for contact");
  });
});
