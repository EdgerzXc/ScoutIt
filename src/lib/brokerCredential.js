// ═══════════════════════════════════════════════════════════════
// RA 9646 credential currency for the broker dossier.
//
// Under the Real Estate Service Act (RA 9646) a PRC real estate broker licence
// is valid for THREE YEARS and renewed with CPD units. ScoutIt's public badge
// was driven by a single Airtable checkbox ticked once by staff, with no expiry
// anywhere in the projection — so a licence that lapsed in 2024 still rendered
// "✓ PRC VERIFIED" today, and the dossier's structured data still asserted
// `RealEstateAgent` with a credential block.
//
// Verification state is OPERATIONAL truth, so it comes from Supabase
// (`user_profiles.prc_expiry`, `prc_verified_at`) rather than from the public
// Airtable content record. That respects the dual-CMS rule: Airtable stays the
// public identity/content source; Supabase stays the operational authority.
//
// Three outcomes, and only one of them may back a licensed-profession claim:
//
//   VERIFIED_CURRENT  — staff verified AND the licence has not expired
//   VERIFIED_UNDATED  — staff verified but no expiry is recorded. We say when
//                       it was checked and claim nothing about today.
//   EXPIRED           — say so plainly rather than going quietly blank
//
// A NULL expiry is not an assertion of validity (Rule 14), and the gate is
// written as "current only when every condition is affirmatively true" so an
// unexpected value cannot fail open (Rule 6).
// ═══════════════════════════════════════════════════════════════

const text = (value) => String(value ?? "").trim();

export const CREDENTIAL_STATES = Object.freeze({
  VERIFIED_CURRENT: "verified_current",
  VERIFIED_UNDATED: "verified_undated",
  EXPIRED: "expired",
  UNVERIFIED: "unverified",
});

const formatDate = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

/**
 * Resolve what may be said publicly about a broker's PRC licence.
 *
 * @param identity  The public Airtable identity (`license`, `licenseVerified`).
 * @param record    Supabase operational credential row, or null when unread.
 * @param now       ISO instant, injected so expiry is testable (Rule 11).
 */
export function buildBrokerCredential({ identity = {}, record = null, now = new Date().toISOString() } = {}) {
  const unverified = {
    state: CREDENTIAL_STATES.UNVERIFIED,
    label: null,
    license: null,
    expiresOn: null,
    canAssertLicensedProfession: false,
  };

  // Staff verification is the precondition. Without it nothing is published —
  // not the badge, and not the licence number.
  if (identity.licenseVerified !== true) return unverified;

  const license = text(identity.license) || null;
  const expiry = text(record?.prcExpiry);
  const verifiedAt = text(record?.prcVerifiedAt);

  if (expiry) {
    // Compare against the END of the expiry day: a licence is valid through
    // the whole of its final day, not until midnight that morning.
    const expiresAt = new Date(`${expiry.slice(0, 10)}T23:59:59.999Z`).getTime();
    const instant = new Date(now).getTime();

    if (Number.isFinite(expiresAt) && Number.isFinite(instant)) {
      if (instant <= expiresAt) {
        return {
          state: CREDENTIAL_STATES.VERIFIED_CURRENT,
          label: `PRC VERIFIED${license ? ` · ${license}` : ""}`,
          license,
          expiresOn: formatDate(expiry),
          canAssertLicensedProfession: true,
        };
      }
      return {
        state: CREDENTIAL_STATES.EXPIRED,
        label: `PRC registration lapsed${formatDate(expiry) ? ` · expired ${formatDate(expiry)}` : ""}`,
        // The number is withheld once the licence has lapsed: publishing it
        // beside a lapse notice reads as a current credential at a glance.
        license: null,
        expiresOn: formatDate(expiry),
        canAssertLicensedProfession: false,
      };
    }
  }

  // Verified at some point, with no usable expiry. Say when it was checked and
  // claim nothing about today.
  return {
    state: CREDENTIAL_STATES.VERIFIED_UNDATED,
    label: verifiedAt && formatDate(verifiedAt)
      ? `PRC checked ${formatDate(verifiedAt)} · renewal date not recorded`
      : "PRC checked · renewal date not recorded",
    license,
    expiresOn: null,
    canAssertLicensedProfession: false,
  };
}
