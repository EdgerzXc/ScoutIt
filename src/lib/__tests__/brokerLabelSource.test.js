import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Comments quoting the old labels must not satisfy guards that forbid them —
// the A-080 trap. Strip comments before asserting on rendered strings.
const readCode = (file) =>
  readFileSync(resolve(process.cwd(), file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const BROKER = "src/components/dashboard/BrokerMode.js";
const OWNER = "src/components/dashboard/OwnerMode.js";

// ── A-112 — a label may not claim more than the value behind it ─────────────
//
// `accepted` is this dashboard's own pitch rows with status==='accepted'. Three
// surfaces sold that as "Deals Won" (a closed deal) and "Verified Advisory
// Portfolio" — where "Verified" means the two-sided handshake everywhere else
// in the product, and here meant only that one owner accepted one pitch.
// `verified_closures` belongs to the snapshot chain and the public dossier.
describe("A-112 broker labels match their source", () => {
  const broker = readCode(BROKER);

  it("no rendered surface claims a won deal from an accepted pitch", () => {
    expect(broker).not.toContain("Deals Won");
  });

  it("no rendered surface claims verification from local pitch rows", () => {
    expect(broker).not.toContain("Verified Advisory Portfolio");
    expect(broker).not.toContain("No Verified Advisory Mandates");
    expect(broker).not.toContain("Loading verified properties");
  });

  it("the count is still shown, under a name that is true of it", () => {
    // Correcting a label must not quietly delete the information. Assert the
    // count is PAIRED with each label — `{accepted.length}` appears in several
    // unrelated places in this file, so a bare containment check survived the
    // mutation that removed it from the label (Rule 19 caught this).
    expect(broker).toContain("{accepted.length} Accepted Mandates");
    expect(broker).toMatch(/Accepted Advisory Mandates/);
    expect(broker).toMatch(/\{accepted\.length\}[^<]*<\/span>\s*<\/div>/);
  });

  it("does not source a verified-closure claim locally", () => {
    // The snapshot chain owns this number. If this dashboard ever renders it,
    // it must come from that chain — not from `accepted`.
    const nearAccepted = broker.match(/verified_closures[\s\S]{0,120}accepted\.length/);
    expect(nearAccepted).toBeNull();
  });
});

// ── A-113 — the pricing signal reaches the screen that asks the question ────
describe("A-113 pricing gauge on the owner dossier", () => {
  const owner = readCode(OWNER);

  it("mounts the gauge the dossier previously lacked", () => {
    expect(owner).toContain('import GeoPricingGauge from "./GeoPricingGauge"');
    expect(owner).toContain("<GeoPricingGauge");
  });

  it("passes the listing's own location, category and price", () => {
    const mount = owner.slice(owner.indexOf("<GeoPricingGauge"), owner.indexOf("</section>", owner.indexOf("<GeoPricingGauge")));
    expect(mount).toContain("activeListing.location");
    expect(mount).toContain("activeListing.spaceCategory");
    expect(mount).toContain("activeListing.price");
  });

  it("gives the section a heading its landmark can be named by", () => {
    expect(owner).toContain('aria-labelledby="listing-pricing-heading"');
    expect(owner).toContain('id="listing-pricing-heading"');
  });
});
