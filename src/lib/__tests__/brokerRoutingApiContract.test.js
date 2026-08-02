import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("LR-02 routing contracts", () => {
  it("captures authenticated leads through the locked routing RPC", () => {
    const route = read("src/app/api/deals/initiate/route.js");
    expect(route).toContain("create_routed_buyer_deal");
    expect(route).toContain("recipientIds");
    expect(route).toContain("routedToRoster");
    expect(route).not.toContain("propertyRow.owner_id");
  });

  it("uses the same resolver for logged-out inquiries", () => {
    const route = read("src/app/api/inquiries/route.js");
    expect(route).toContain("getPropertyLeadRecipients");
    expect(route).toContain("formatRoutingMetadata");
    expect(route).toContain("for (const recipient of routing.recipients)");
  });

  it("makes routed brokers first-class deal parties", () => {
    const deals = read("src/app/api/deals/route.js");
    const messages = read("src/app/api/deals/[id]/messages/route.js");
    expect(deals).toContain("deal_routing_recipients");
    expect(messages).toContain("isRoutedDealRecipient");
  });

  it("makes the property roster property-scoped and additive", () => {
    const route = read("src/app/api/property/[id]/brokers/route.js");
    const migration = read("supabase/migrations/20260802000002_broker_representation_routing.sql");
    expect(route).toContain("getPropertyLeadRecipients");
    const resolver = read("src/lib/serverBrokerRouting.js");
    expect(resolver).toContain("get_property_lead_recipients");
    expect(migration).toContain("UNIQUE (property_id, broker_id)");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("deal_routing_recipients");
  });
});
