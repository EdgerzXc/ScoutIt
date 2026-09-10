/**
 * WHO IS ALLOWED TO SEE WHOSE NAME. One rule, one place.
 *
 * ScoutIt's identity model, in the owner's words: a person can browse without
 * an account; they must sign in to reach for someone; the first Connect is
 * still anonymous; and identity is revealed by an ACT — acceptance for the
 * name, the handshake for contact details. Standing Rule 9 states the
 * principle: a tier buys DATA about a PROPERTY, never access to a PERSON.
 *
 * WHY THIS MODULE EXISTS RATHER THAN AN `if` IN EACH SCREEN.
 * The rule was previously enforced in exactly one component and nowhere else.
 * `ChatBox` correctly told a recipient *"From a verified Broker · name revealed
 * on accept"* — while the conversation list beside it rendered the sender's real
 * name unconditionally, and `/api/deals` handed that name to every caller with
 * no check on deal status and no check on the person's own privacy setting. The
 * promise and the leak were visible in one glance. A rule that lives in a
 * component protects that component; a rule that lives here protects whatever
 * is written next.
 *
 * THE POLARITY IS DELIBERATE: this module answers "may I reveal?" and defaults
 * to NO. Standing Rule 6 — a gate written as a negative check fails open — and
 * Standing Rule 14 — a NULL is never an assertion. An unset privacy flag is not
 * consent to publish a name.
 */

/**
 * Statuses that exist only AFTER the recipient accepted. Acceptance is the act
 * that reveals the name, so these are the only states where a counterparty's
 * name may be shown to someone who did not already know it.
 *
 * Deliberately excluded, each for a reason:
 *   `pending`   — what `/api/deals/initiate` and `/api/deals/pitch` both write
 *                 on creation. The request has not been answered.
 *   `invited`   — the owner-invites-broker shape, still awaiting an answer.
 *   `pitching`  — the column's historical default. Nothing writes it any more;
 *                 treated as unrevealed because failing closed on a legacy value
 *                 costs a label, and failing open costs someone's name.
 *   `declined`  — refused while still pending. Nothing was ever revealed, and a
 *   `withdrawn`   refusal must not become a disclosure.
 *   `expired`
 *
 * `closed` and `reported` ARE included: both imply a conversation happened,
 * which means acceptance happened. Re-hiding a name the two parties have been
 * using for a week is theatre, not privacy.
 */
export const IDENTITY_REVEALING_STATUSES = Object.freeze([
  "accepted",
  "active",
  "connected",
  "closed",
  "reported",
]);

/**
 * Is this person's identity already public knowledge?
 *
 * Reads the profile flag rather than assuming. NULL and undefined both mean
 * "not public" — the column's own default is `false`, and a missing value is
 * the absence of a decision, not a decision to publish.
 *
 * ── THE SEAM ────────────────────────────────────────────────────────────
 * The owner's ask (2026-09-10) is that a property owner can keep their name
 * off their own listings. Today that maps onto `is_profile_public`, which is
 * the only identity-visibility field the live schema has — verified against
 * `information_schema`, not against a migration file (Standing Rule 20).
 *
 * If a dedicated per-listing flag is ever added, **this function is the only
 * thing that changes.** No caller reads the column directly, precisely so that
 * adding one is a migration plus four lines here, rather than a hunt.
 */
export function isIdentityPublic(profile) {
  return profile?.is_profile_public === true;
}

/**
 * May the viewer see the counterparty's name?
 *
 * Two independent grounds, and either is sufficient:
 *
 *  1. **The deal reached acceptance.** The recipient chose to open the
 *     conversation, and that act is the reveal.
 *  2. **The viewer sent the request AND the counterparty's identity is already
 *     public.** This is the subtle one, and it is why the sender is not simply
 *     trusted: the old reasoning was "the sender already knows who they
 *     contacted". That holds only while the counterparty publishes their name.
 *     An owner who has turned their name off was never known to the sender, so
 *     showing it at the moment of contact would leak precisely what they
 *     switched off.
 *
 * @param {object} input
 * @param {boolean} input.viewerIsSender      did this viewer open the request
 * @param {string}  input.dealStatus          the deal's current status
 * @param {boolean} input.counterpartyIsPublic result of isIdentityPublic()
 * @returns {boolean}
 */
export function canSeeCounterpartyName({
  viewerIsSender = false,
  dealStatus = "",
  counterpartyIsPublic = false,
} = {}) {
  if (IDENTITY_REVEALING_STATUSES.includes(dealStatus)) return true;
  return viewerIsSender === true && counterpartyIsPublic === true;
}

/**
 * What to actually render for the counterparty.
 *
 * Returns the role label when the name is withheld, never an empty string and
 * never "Anonymous" — the recipient of a Connect request is entitled to know
 * *what* reached them ("a verified Broker") even when they may not know *who*.
 * That is §38.3's rule: intent and tier, not identity.
 *
 * A missing name falls back to the label too, so "we are withholding this" and
 * "there is nothing on file" render identically to the reader. They are
 * different facts, but neither is a name, and inventing a distinction would
 * disclose which one it is.
 */
export function counterpartyDisplayName({
  viewerIsSender = false,
  dealStatus = "",
  counterpartyIsPublic = false,
  name = "",
  roleLabel = "Member",
} = {}) {
  const label = roleLabel || "Member";
  if (!canSeeCounterpartyName({ viewerIsSender, dealStatus, counterpartyIsPublic })) {
    return label;
  }
  const clean = typeof name === "string" ? name.trim() : "";
  return clean || label;
}

/**
 * Is this viewer the one who opened the request?
 *
 * The `deals` table has **no** `initiated_by` column — verified against
 * `information_schema` on 2026-09-10 — so this is derived, and it is derived
 * in one place because two derivations that drift is how the API and the UI
 * end up disagreeing about whether a name may be shown.
 *
 * A buyer is the sender: they spent the Connect to reach out. Everyone else is
 * treated as a recipient, which is the conservative reading — being wrongly
 * treated as a recipient costs a label, being wrongly treated as a sender
 * costs someone's name. `ChatBox` has always applied exactly this rule; it now
 * imports it instead of restating it.
 */
export function viewerIsRequestSender(myRole) {
  return (myRole || "buyer") === "buyer";
}
