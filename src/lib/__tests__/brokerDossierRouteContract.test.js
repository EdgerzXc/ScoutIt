import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routePath = "src/app/api/broker/dossier/route.js";
const readRoute = () => readFileSync(resolve(process.cwd(), routePath), "utf8");

describe("A-023 phase 3 - broker dossier API contract", () => {
  it("re-derives identity and BrokerID ownership for every method", () => {
    const route = readRoute();
    expect(route).toContain("resolveUserId(request)");
    expect(route).toContain("hasBrokerDossierAuthority(userId, bundle.brokers)");
    expect(route).not.toMatch(/brokerId\s*=\s*body\./);
  });

  it("validates the allowlisted draft before the owner-bound save RPC", () => {
    const route = readRoute();
    expect(route).toContain("validateBrokerDossierDraft(body.draft)");
    expect(route.indexOf("validateBrokerDossierDraft(body.draft)")).toBeLessThan(
      route.indexOf("saveBrokerDossierDraft({"),
    );
    expect(route).toContain("isGlobalReadOnly()");
  });

  it("writes Airtable before recording publication and never accepts a browser record id", () => {
    const route = readRoute();
    expect(route.indexOf("pushBrokerNarrativeToAirtable({")).toBeLessThan(
      route.indexOf("markBrokerDossierPublished({"),
    );
    expect(route.indexOf("pushBrokerNarrativeToAirtable({")).toBeLessThan(
      route.indexOf("invalidateCmsBundle()"),
    );
    expect(route.indexOf("invalidateCmsBundle()")).toBeLessThan(
      route.indexOf("markBrokerDossierPublished({"),
    );
    expect(route).not.toMatch(/airtableRecordId\s*=\s*body\./);
    expect(route).toContain('"Cache-Control": "private, no-store"');
  });
});
