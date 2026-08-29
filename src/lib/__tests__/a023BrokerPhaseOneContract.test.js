import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("A-023 broker phase-one trust contract", () => {
  it("does not publish an unsupported composite rating on the canonical dossier", () => {
    const page = read("src/app/brokers/[broker-slug]/page.js");
    // A-023 phase 3 extracted the identity block into one shared presentational
    // component so the public dossier and the editor preview cannot drift. The
    // honest-record guarantee moved with the markup; it did not go away.
    const identity = read("src/components/brokers/BrokerDossierIdentity.js");

    expect(page).toContain("<BrokerDossierIdentity");
    expect(identity).toContain("Building a ScoutIt record");
    for (const source of [page, identity]) {
      expect(source).not.toContain("scoutRating");
      expect(source).not.toContain("/100");
    }
    expect(page).not.toContain("broker.scoutRating");
    expect(page).not.toContain("broker.metrics");
    expect(page).not.toContain("broker.closures");
    expect(page).not.toContain("/100");
  });

  it("keeps the property roster authoritative without invented ranking claims", () => {
    const client = read("src/app/property/[id]/brokers/BrokersClient.js");

    expect(client).toContain("Roster order follows current representation authority");
    expect(client).not.toMatch(/subscription tier/i);
    expect(client).not.toMatch(/purely meritocratic/i);
    expect(client).not.toContain("Top Rated");
    expect(client).not.toContain("b.rating - a.rating");
    expect(client).not.toContain("broker.rating");
  });

  it("does not leak legacy rating fields through the property roster API", () => {
    const route = read("src/app/api/property/[id]/brokers/route.js");

    expect(route).not.toContain("scout_rating");
    expect(route).not.toContain("verified_closures");
    expect(route).not.toMatch(/\brating:/);
    expect(route).not.toMatch(/\bclosures:/);
  });

  it("retires the conflicting five-point profile panel", () => {
    const panel = read("src/components/profile/panels/BrokerPanel.js");

    expect(panel).toContain("Building a ScoutIt record");
    expect(panel).not.toContain("out of 5.0");
    expect(panel).not.toContain("data.scout_rating");
    expect(panel).not.toContain("What improves your rating?");
  });

  it("keeps broker-shaped legacy profiles out of the search index", () => {
    const layout = read("src/app/profile/[username]/layout.js");

    expect(layout).toContain("active_roles");
    expect(layout).toContain("isBrokerShape");
    expect(layout).toContain("!isBrokerShape");
  });
});
