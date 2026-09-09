// ═══════════════════════════════════════════════════════════════
// A-038 — the single definition of "this person may recommend this advisor".
//
// It lived inline in the POST route, which was fine while the route was the
// only reader. The invitation panel has to ask the same question BEFORE it
// offers the prompt, and two copies of an eligibility rule drift apart — the
// UI eventually invites someone the route then refuses, or worse, stops
// inviting someone who qualifies. A-038's acceptance names this explicitly:
// reuse the qualification the record already uses rather than write a second.
//
// The rule, in one place:
//   a real deal between this client and this broker,
//   carrying a two-sided transaction handshake,
//   completed, with BOTH signatures actually recorded.
//
// An inquiry, a message thread, a broker request, or a half-signed handshake
// is not a relationship that earns permanent public commentary about a
// licensed professional.
// ═══════════════════════════════════════════════════════════════

export const QUALIFYING_HANDSHAKE_TYPE = "transaction_handshake";
export const QUALIFYING_HANDSHAKE_STATUS = "completed";

// A person's dealings with one advisor, not their whole history.
const DEAL_SCAN_LIMIT = 50;
// The invitation panel reads across every advisor, so it scans wider.
const PORTFOLIO_SCAN_LIMIT = 200;

/**
 * Deals where `userId` is the buyer. Pass `brokerId` to narrow to one advisor.
 *
 * Returns `{ ok: false, stage: "deals" }` on failure rather than throwing, so
 * a caller can answer with its own honest message instead of leaking the
 * database error.
 */
export async function listClientDeals(client, { userId, brokerId = null } = {}) {
  if (!client || !userId) return { ok: false, stage: "deals", deals: [] };

  let query = client.from("deals").select("id, broker_id").eq("buyer_id", userId);
  if (brokerId) query = query.eq("broker_id", brokerId);

  const { data, error } = await query.limit(brokerId ? DEAL_SCAN_LIMIT : PORTFOLIO_SCAN_LIMIT);
  if (error) return { ok: false, stage: "deals", deals: [] };
  return { ok: true, deals: data || [] };
}

/**
 * The completed two-sided handshakes on those deals.
 *
 * Both `party_a_signed_at` and `party_b_signed_at` must be present. A status
 * of "completed" alone is not trusted here — the signatures are the evidence.
 */
export async function listQualifyingHandshakes(client, dealIds = [], limit = PORTFOLIO_SCAN_LIMIT) {
  if (!client || !dealIds.length) return { ok: true, handshakes: [] };

  const { data, error } = await client
    .from("deal_handshakes")
    .select("id, deal_id")
    .in("deal_id", dealIds)
    .eq("handshake_type", QUALIFYING_HANDSHAKE_TYPE)
    .eq("status", QUALIFYING_HANDSHAKE_STATUS)
    .not("party_a_signed_at", "is", null)
    .not("party_b_signed_at", "is", null)
    .limit(limit);

  if (error) return { ok: false, stage: "handshakes", handshakes: [] };
  return { ok: true, handshakes: data || [] };
}

/**
 * One qualifying handshake id for this client and this advisor, or null.
 *
 * `stage` tells the caller which lookup failed so it can keep the two
 * different honest refusals the route already publishes.
 */
export async function resolveQualifyingHandshakeId(client, { userId, brokerId } = {}) {
  const dealResult = await listClientDeals(client, { userId, brokerId });
  if (!dealResult.ok) return { ok: false, stage: "deals", handshakeId: null };
  if (!dealResult.deals.length) return { ok: true, handshakeId: null, hasDeal: false };

  const handshakeResult = await listQualifyingHandshakes(
    client,
    dealResult.deals.map((deal) => deal.id),
    1,
  );
  if (!handshakeResult.ok) return { ok: false, stage: "handshakes", handshakeId: null };

  return {
    ok: true,
    hasDeal: true,
    handshakeId: handshakeResult.handshakes[0]?.id || null,
  };
}

/**
 * Every advisor this client could recommend right now, minus the ones they
 * already have.
 *
 * Already-submitted rows are excluded regardless of moderation state. A
 * pending or rejected recommendation still occupies the unique
 * (broker, author, handshake) slot, so re-inviting would walk the person into
 * a 409 — and a rejected submission must not be quietly re-openable.
 */
/**
 * Is the satisfaction signal actually storable yet?
 *
 * `20260831000001_broker_satisfaction_signal.sql` adds the constrained
 * `satisfaction_level` column and is owner-gated under W-003. Until it is
 * applied, a submission would be accepted by the form and then refused by the
 * database — the client loses what they wrote, on the one surface where their
 * words are the entire point.
 *
 * So the invitation is withheld rather than offered on a promise. Probed once
 * per process because the answer changes exactly once, when the migration is
 * applied, and a cold start after that picks it up.
 */
let signalReadyProbe = null;

export function resetSatisfactionSignalProbe() {
  signalReadyProbe = null;
}

export async function isSatisfactionSignalReady(client) {
  if (!client) return false;
  if (signalReadyProbe !== null) return signalReadyProbe;

  const { error } = await client.from("broker_recommendations").select("satisfaction_level").limit(1);

  // Only a missing column means "not ready". Any other failure is a transient
  // read problem and must not be cached as a permanent capability answer.
  if (error) {
    const missingColumn = /satisfaction_level/i.test(error.message || "");
    if (missingColumn) signalReadyProbe = false;
    return false;
  }

  signalReadyProbe = true;
  return true;
}

export async function listRecommendationOpportunities(client, { userId } = {}) {
  if (!(await isSatisfactionSignalReady(client))) {
    return { ok: true, opportunities: [], signalReady: false };
  }

  const dealResult = await listClientDeals(client, { userId });
  if (!dealResult.ok) return { ok: false, stage: "deals", opportunities: [] };
  if (!dealResult.deals.length) return { ok: true, opportunities: [] };

  const brokerByDeal = new Map(dealResult.deals.map((deal) => [deal.id, deal.broker_id]));
  const handshakeResult = await listQualifyingHandshakes(
    client,
    dealResult.deals.map((deal) => deal.id),
  );
  if (!handshakeResult.ok) return { ok: false, stage: "handshakes", opportunities: [] };
  if (!handshakeResult.handshakes.length) return { ok: true, opportunities: [] };

  // One invitation per advisor — the earliest qualifying handshake wins, so a
  // client with several completed deals is asked once, not once per deal.
  const byBroker = new Map();
  for (const handshake of handshakeResult.handshakes) {
    const brokerId = brokerByDeal.get(handshake.deal_id);
    if (!brokerId || byBroker.has(brokerId)) continue;
    byBroker.set(brokerId, { brokerId, handshakeId: handshake.id, dealId: handshake.deal_id });
  }
  if (!byBroker.size) return { ok: true, opportunities: [] };

  const { data: existing, error: existingError } = await client
    .from("broker_recommendations")
    .select("broker_id")
    .eq("author_user_id", userId)
    .in("broker_id", [...byBroker.keys()]);

  if (existingError) return { ok: false, stage: "existing", opportunities: [] };

  for (const row of existing || []) byBroker.delete(row.broker_id);

  return { ok: true, opportunities: [...byBroker.values()] };
}
