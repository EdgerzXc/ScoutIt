// ═══════════════════════════════════════════════════════════════════════════════
// LISTING VERIFICATION CLAIM  (A-235 · SH-03)
//
// The promotional surfaces used to print VERIFIED as a decoration:
//
//   "VERIFIED SPACE DOSSIER" · "VERIFIED SPECIFICATIONS" ·
//   "SCAN TO VIEW VERIFIED DOSSIER" · "Verified signals on record"
//
// Nothing decided those words. A draft, a never-confirmed listing, a sample
// and a listing the owner re-confirmed last week all printed the same
// VERIFIED badge — so the badge carried no information and, worse, made a
// claim ScoutIt cannot support for the space.
//
// This module is the ONE place that decides what a listing may be called. It
// answers from data that already exists:
//
//   · `last_verified_date` — Airtable's Last_Verified_Date, mirrored on
//     Supabase. The owner re-confirmed the listing's accuracy on that date.
//     NULL means never confirmed, and NULL is never read as fresh.
//   · `pipeline_status` — a Supabase row that has never been approved is a
//     draft, whatever else it carries.
//   · `is_sample` — a demo listing. It must never present itself as a
//     confirmed space.
//
// The vocabulary is the platform's existing one (see lib/freshness.js and
// intelSourceLabel): "ScoutIt verified N days ago" for a re-confirmed
// listing, "Owner-submitted" for one that has not been re-confirmed.
//
// A delegated child unit has its own row and its own (empty) confirmation
// date, so it falls to the owner-submitted case on its own — it can never
// inherit the parent's claim.
// ═══════════════════════════════════════════════════════════════════════════════

import { getFreshness } from "@/lib/freshness";

export const VERIFICATION_CLAIM = Object.freeze({
  /** A sample/demo listing. Never a confirmed space. */
  SAMPLE: "sample",
  /** Not published yet — a draft must not be marketed as a listing. */
  UNPUBLISHED: "unpublished",
  /** The owner re-confirmed the listing recently. The strongest claim the
   *  public data can support. */
  CONFIRMED: "confirmed",
  /** Owner-submitted and not re-confirmed. Real, but not confirmed. */
  OWNER_SUBMITTED: "owner_submitted",
});

const LIVE_PIPELINE_STATUSES = new Set(["approved", "archived", "off_market"]);

function readConfirmationDate(property = {}) {
  return property.last_verified_date ?? property.lastVerifiedDate ?? null;
}

function isSampleListing(property = {}) {
  return property.is_sample === true || property.isSample === true;
}

function isUnpublished(property = {}) {
  const pipelineStatus = String(property.pipeline_status || "").trim().toLowerCase();
  if (!pipelineStatus) return false; // A public Airtable row is approved by
  // definition — the bundle only carries approved listings.
  return !LIVE_PIPELINE_STATUSES.has(pipelineStatus);
}

/**
 * What may this listing be called?
 *
 * @param {object} property any listing shape (Airtable card, Supabase row)
 * @param {number} [now]
 * @returns {{claim: string, isSample: boolean, isUnpublished: boolean, confirmedAt: string|null, days: number|null, freshnessId: string}}
 */
export function listingVerificationState(property = {}, now = Date.now()) {
  const confirmedAt = readConfirmationDate(property);
  const freshness = getFreshness(confirmedAt, now);
  const isSample = isSampleListing(property);
  const unpublished = isUnpublished(property);

  let claim = VERIFICATION_CLAIM.OWNER_SUBMITTED;
  if (isSample) claim = VERIFICATION_CLAIM.SAMPLE;
  else if (unpublished) claim = VERIFICATION_CLAIM.UNPUBLISHED;
  else if (freshness.id === "fresh") claim = VERIFICATION_CLAIM.CONFIRMED;

  return {
    claim,
    isSample,
    isUnpublished: unpublished,
    confirmedAt,
    days: freshness.days,
    freshnessId: freshness.id,
  };
}

/** "OWNER RE-CONFIRMED 3 DAYS AGO" — the date belongs next to the claim. */
function confirmationLine(state) {
  if (state.claim === VERIFICATION_CLAIM.SAMPLE) return "SAMPLE LISTING · NOT A REAL SPACE";
  if (state.claim === VERIFICATION_CLAIM.UNPUBLISHED) return "DRAFT · NOT YET PUBLISHED";
  if (state.claim === VERIFICATION_CLAIM.CONFIRMED) {
    if (state.days === 0) return "OWNER RE-CONFIRMED TODAY";
    if (state.days === 1) return "OWNER RE-CONFIRMED YESTERDAY";
    if (state.days < 30) return `OWNER RE-CONFIRMED ${state.days} DAYS AGO`;
    return "OWNER RE-CONFIRMED WITHIN 30 DAYS";
  }
  if (state.days === null) return "OWNER-SUBMITTED · NEVER RE-CONFIRMED";
  if (state.days < 60) return `OWNER-SUBMITTED · ${state.days} DAYS SINCE RE-CONFIRMATION`;
  const months = Math.floor(state.days / 30);
  if (months < 12) return `OWNER-SUBMITTED · ${months} MONTHS SINCE RE-CONFIRMATION`;
  return "OWNER-SUBMITTED · OVER A YEAR SINCE RE-CONFIRMATION";
}

/**
 * The copy every promotional surface must use.
 *
 * @param {object} property
 * @param {{ via?: boolean, now?: number }} [options] `via` marks a share that
 *   travels through a promoter's tracked link — the promoter is verified
 *   server-side, the space is not.
 */
export function listingVerificationCopy(property = {}, { via = false, now = Date.now() } = {}) {
  const state = listingVerificationState(property, now);
  const confirmed = state.claim === VERIFICATION_CLAIM.CONFIRMED;

  let dossierTitle = "OWNER-SUBMITTED SPACE DOSSIER";
  let specHeader = "RECORDED SPECIFICATIONS";
  let signalsHeader = "Owner-submitted signals on record";
  let dossierLinkLine = "View the dossier & request a private viewing:";

  if (state.claim === VERIFICATION_CLAIM.SAMPLE) {
    dossierTitle = "SAMPLE SPACE DOSSIER";
    specHeader = "SAMPLE SPECIFICATIONS";
    signalsHeader = "Sample signals on record";
    dossierLinkLine = "View the sample dossier:";
  } else if (state.claim === VERIFICATION_CLAIM.UNPUBLISHED) {
    dossierTitle = "UNPUBLISHED SPACE DOSSIER";
    specHeader = "DRAFT SPECIFICATIONS";
    signalsHeader = "Draft signals on record";
    dossierLinkLine = "View the draft dossier:";
  } else if (confirmed) {
    dossierTitle = "SCOUTIT-VERIFIED SPACE DOSSIER";
    specHeader = "SCOUTIT-VERIFIED SPECIFICATIONS";
    signalsHeader = "ScoutIt-verified signals on record";
    dossierLinkLine = "View the ScoutIt-verified dossier & request a private viewing:";
  }

  if (via) {
    dossierTitle = dossierTitle.replace(" SPACE DOSSIER", " VIA PARTNER DOSSIER");
  }

  return {
    dossierTitle,
    specHeader,
    signalsHeader,
    dossierLinkLine,
    verificationLine: confirmationLine(state),
    // The scan line points at a dossier, never at a promise about it.
    scanLine: via ? "SCAN FOR PARTNER PRIORITY DOSSIER" : "SCAN TO VIEW THIS DOSSIER",
    state,
  };
}

export default listingVerificationState;
