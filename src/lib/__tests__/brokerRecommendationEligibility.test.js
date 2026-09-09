import {
  isSatisfactionSignalReady,
  listClientDeals,
  listQualifyingHandshakes,
  listRecommendationOpportunities,
  resetSatisfactionSignalProbe,
  resolveQualifyingHandshakeId,
} from "@/lib/brokerRecommendationEligibility";

// The capability probe is memoised per process, so every test starts from an
// unknown answer rather than inheriting the previous test's database.
beforeEach(() => resetSatisfactionSignalProbe());

// ─────────────────────────────────────────────────────────────────────────
// A-038 — one definition of "may this person recommend this advisor".
//
// These are behavioural, not source assertions: the rule is the thing that
// must not drift, and the drift that matters is a client being INVITED and
// then REFUSED, or refused when they qualify. Both directions are tested.
//
// The fake client records every filter applied, so a silently dropped
// signature check fails here rather than in production.
// ─────────────────────────────────────────────────────────────────────────

function fakeClient(tables) {
  const calls = [];

  return {
    calls,
    from(table) {
      const record = { table, filters: [], limit: null };
      calls.push(record);

      const builder = {
        select() {
          return builder;
        },
        eq(column, value) {
          record.filters.push(["eq", column, value]);
          return builder;
        },
        in(column, values) {
          record.filters.push(["in", column, values]);
          return builder;
        },
        not(column, operator, value) {
          record.filters.push(["not", column, operator, value]);
          return builder;
        },
        limit(count) {
          record.limit = count;
          return builder.then();
        },
        then(onFulfilled) {
          const handler = tables[table];
          const result =
            typeof handler === "function" ? handler(record) : handler || { data: [], error: null };
          return onFulfilled ? Promise.resolve(result).then(onFulfilled) : Promise.resolve(result);
        },
      };

      return builder;
    },
  };
}

const ok = (data) => ({ data, error: null });
const fails = () => ({ data: null, error: { message: "boom" } });

describe("listClientDeals", () => {
  it("only returns deals where this user is the buyer", async () => {
    const client = fakeClient({ deals: ok([{ id: "d1", broker_id: "b1" }]) });

    const result = await listClientDeals(client, { userId: "u1" });

    expect(result.ok).toBe(true);
    expect(result.deals).toHaveLength(1);
    expect(client.calls[0].filters).toContainEqual(["eq", "buyer_id", "u1"]);
  });

  it("narrows to one advisor when a brokerId is given", async () => {
    const client = fakeClient({ deals: ok([]) });

    await listClientDeals(client, { userId: "u1", brokerId: "b1" });

    expect(client.calls[0].filters).toContainEqual(["eq", "broker_id", "b1"]);
  });

  it("reports the failing stage instead of throwing", async () => {
    const client = fakeClient({ deals: fails() });

    const result = await listClientDeals(client, { userId: "u1" });

    expect(result).toMatchObject({ ok: false, stage: "deals", deals: [] });
  });

  it("refuses to query at all without a user", async () => {
    const client = fakeClient({ deals: ok([{ id: "d1" }]) });

    const result = await listClientDeals(client, { userId: null });

    expect(result.ok).toBe(false);
    expect(client.calls).toHaveLength(0);
  });
});

describe("listQualifyingHandshakes", () => {
  it("requires a completed two-sided transaction handshake with both signatures", async () => {
    const client = fakeClient({ deal_handshakes: ok([{ id: "h1", deal_id: "d1" }]) });

    await listQualifyingHandshakes(client, ["d1"]);

    const { filters } = client.calls[0];
    expect(filters).toContainEqual(["eq", "handshake_type", "transaction_handshake"]);
    expect(filters).toContainEqual(["eq", "status", "completed"]);
    expect(filters).toContainEqual(["not", "party_a_signed_at", "is", null]);
    expect(filters).toContainEqual(["not", "party_b_signed_at", "is", null]);
  });

  it("does not query when there are no deals to check", async () => {
    const client = fakeClient({ deal_handshakes: ok([{ id: "h1" }]) });

    const result = await listQualifyingHandshakes(client, []);

    expect(result).toMatchObject({ ok: true, handshakes: [] });
    expect(client.calls).toHaveLength(0);
  });
});

describe("resolveQualifyingHandshakeId", () => {
  it("returns the handshake id when the connection qualifies", async () => {
    const client = fakeClient({
      deals: ok([{ id: "d1", broker_id: "b1" }]),
      deal_handshakes: ok([{ id: "h1", deal_id: "d1" }]),
    });

    const result = await resolveQualifyingHandshakeId(client, { userId: "u1", brokerId: "b1" });

    expect(result).toMatchObject({ ok: true, hasDeal: true, handshakeId: "h1" });
  });

  it("separates 'no deal at all' from 'a deal without a completed handshake'", async () => {
    const noDeal = fakeClient({ deals: ok([]) });
    expect(await resolveQualifyingHandshakeId(noDeal, { userId: "u1", brokerId: "b1" })).toMatchObject(
      { ok: true, hasDeal: false, handshakeId: null },
    );

    // The route publishes two different honest refusals for these two cases;
    // collapsing them would tell a mid-transaction client they never worked
    // with their own advisor.
    const noHandshake = fakeClient({
      deals: ok([{ id: "d1", broker_id: "b1" }]),
      deal_handshakes: ok([]),
    });
    expect(
      await resolveQualifyingHandshakeId(noHandshake, { userId: "u1", brokerId: "b1" }),
    ).toMatchObject({ ok: true, hasDeal: true, handshakeId: null });
  });

  it("names which lookup failed so the caller can answer accurately", async () => {
    const dealFailure = fakeClient({ deals: fails() });
    expect(await resolveQualifyingHandshakeId(dealFailure, { userId: "u1", brokerId: "b1" })).toMatchObject(
      { ok: false, stage: "deals" },
    );

    const handshakeFailure = fakeClient({
      deals: ok([{ id: "d1", broker_id: "b1" }]),
      deal_handshakes: fails(),
    });
    expect(
      await resolveQualifyingHandshakeId(handshakeFailure, { userId: "u1", brokerId: "b1" }),
    ).toMatchObject({ ok: false, stage: "handshakes" });
  });

  it("never reports a handshake id on failure", async () => {
    const client = fakeClient({
      deals: ok([{ id: "d1", broker_id: "b1" }]),
      deal_handshakes: fails(),
    });

    const result = await resolveQualifyingHandshakeId(client, { userId: "u1", brokerId: "b1" });

    expect(result.handshakeId).toBeNull();
  });
});

describe("isSatisfactionSignalReady", () => {
  const missingColumn = () => ({
    data: null,
    error: { message: 'column broker_recommendations.satisfaction_level does not exist' },
  });

  it("is false while the owner-gated migration is unapplied", async () => {
    const client = fakeClient({ broker_recommendations: missingColumn() });
    expect(await isSatisfactionSignalReady(client)).toBe(false);
  });

  it("is true once the column exists", async () => {
    const client = fakeClient({ broker_recommendations: ok([]) });
    expect(await isSatisfactionSignalReady(client)).toBe(true);
  });

  it("does not cache a transient read failure as a permanent answer", async () => {
    const flaky = fakeClient({
      broker_recommendations: { data: null, error: { message: "connection reset" } },
    });
    expect(await isSatisfactionSignalReady(flaky)).toBe(false);

    // A network blip must not disable the feature until the next cold start.
    resetSatisfactionSignalProbe();
    const healthy = fakeClient({ broker_recommendations: ok([]) });
    expect(await isSatisfactionSignalReady(healthy)).toBe(true);
  });

  it("withholds every invitation while the signal cannot be stored", async () => {
    // The client would otherwise be invited to write something the database
    // refuses, losing their words on the one surface where they are the point.
    const client = fakeClient({ broker_recommendations: missingColumn() });

    const result = await listRecommendationOpportunities(client, { userId: "u1" });

    expect(result).toMatchObject({ ok: true, opportunities: [], signalReady: false });
    // It must not even look at who this person dealt with.
    expect(client.calls.map((call) => call.table)).toEqual(["broker_recommendations"]);
  });
});

describe("listRecommendationOpportunities", () => {
  it("invites once per advisor even when several deals qualify", async () => {
    const client = fakeClient({
      deals: ok([
        { id: "d1", broker_id: "b1" },
        { id: "d2", broker_id: "b1" },
      ]),
      deal_handshakes: ok([
        { id: "h1", deal_id: "d1" },
        { id: "h2", deal_id: "d2" },
      ]),
      broker_recommendations: ok([]),
    });

    const result = await listRecommendationOpportunities(client, { userId: "u1" });

    expect(result.opportunities).toEqual([{ brokerId: "b1", handshakeId: "h1", dealId: "d1" }]);
  });

  it("excludes advisors this client has already written about", async () => {
    const client = fakeClient({
      deals: ok([
        { id: "d1", broker_id: "b1" },
        { id: "d2", broker_id: "b2" },
      ]),
      deal_handshakes: ok([
        { id: "h1", deal_id: "d1" },
        { id: "h2", deal_id: "d2" },
      ]),
      // Moderation state is deliberately not part of this lookup: a pending
      // or rejected row still holds the unique slot, so re-inviting would
      // walk the person into a duplicate-key refusal.
      broker_recommendations: ok([{ broker_id: "b1" }]),
    });

    const result = await listRecommendationOpportunities(client, { userId: "u1" });

    expect(result.opportunities.map((item) => item.brokerId)).toEqual(["b2"]);
  });

  it("returns nothing when a deal exists but no handshake completed", async () => {
    const client = fakeClient({
      deals: ok([{ id: "d1", broker_id: "b1" }]),
      deal_handshakes: ok([]),
      broker_recommendations: ok([]),
    });

    const result = await listRecommendationOpportunities(client, { userId: "u1" });

    expect(result).toMatchObject({ ok: true, opportunities: [] });
  });

  it("never invents an invitation when a lookup fails", async () => {
    const client = fakeClient({
      deals: ok([{ id: "d1", broker_id: "b1" }]),
      deal_handshakes: ok([{ id: "h1", deal_id: "d1" }]),
      // The unfiltered first read is the capability probe; the filtered one is
      // the already-recommended lookup, and only that one fails here.
      broker_recommendations: (record) => (record.filters.length ? fails() : ok([])),
    });

    const result = await listRecommendationOpportunities(client, { userId: "u1" });

    expect(result).toMatchObject({ ok: false, stage: "existing", opportunities: [] });
  });

  it("drops a handshake whose deal is not this client's", async () => {
    // Defence in depth: the handshake query is keyed by deal id, so a row that
    // maps to no known deal must not become an invitation to recommend a
    // stranger.
    const client = fakeClient({
      deals: ok([{ id: "d1", broker_id: "b1" }]),
      deal_handshakes: ok([{ id: "h9", deal_id: "d-unknown" }]),
      broker_recommendations: ok([]),
    });

    const result = await listRecommendationOpportunities(client, { userId: "u1" });

    expect(result.opportunities).toEqual([]);
  });
});
