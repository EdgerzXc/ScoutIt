// ═══════════════════════════════════════════════════════════════
// A-134 / U-032 — accepting a broker: what the owner is told, and who may answer
//
// REPRESENTATION_AND_DISCLOSURE_RULES §2 is the canonical rule. The owner has no
// veto over how a broker runs a listing once accepted ("we don't transact"), so
// the moment of acceptance is the only point where they learn what they are
// handing over. The notice is said before the click, on every surface where an
// owner can accept a broker.
//
// Plain words only: "Remove this broker", never "representation" — the owner
// was shown the jargon and did not know what it meant.
// ═══════════════════════════════════════════════════════════════

import { REPRESENTATION_STATES } from "@/lib/brokerRepresentation";

export const DELEGATION_ACCEPT_NOTICE =
  "Accepting lets this broker handle this listing for you. From then on, how the listing is run is up to them — ScoutIt doesn't step in between you. You can remove this broker at any time, and doing so closes their conversations about this property.";

/** A request between a broker and a property's owner, with no buyer in it. */
export function isBrokerRepresentationDeal(deal) {
  return Boolean(deal?.broker_id) && !deal?.buyer_id;
}

/**
 * Who may answer a broker request. An owner's invitation (`invited`) is answered
 * by the broker; a broker's pitch (any other state) is answered by the owner.
 * The side that started the request never answers it — otherwise a broker could
 * accept their own pitch and make themselves the owner's broker (U-032).
 */
export function mayAnswerBrokerRequest(deal, actorId) {
  if (!isBrokerRepresentationDeal(deal) || !actorId) return false;
  if (deal.status === "invited") return deal.broker_id === actorId;
  return deal.properties?.owner_id === actorId;
}

/** The representation state an answer sets, or null when the status is not an answer. */
export function representationStateForAnswer(newStatus) {
  if (newStatus === "accepted") return REPRESENTATION_STATES.ACTIVE;
  if (newStatus === "declined") return REPRESENTATION_STATES.DECLINED;
  return null;
}
