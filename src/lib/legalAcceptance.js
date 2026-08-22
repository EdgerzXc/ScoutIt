import {
  CURRENT_TERMS_EFFECTIVE_DATE,
  CURRENT_TERMS_SNAPSHOT_HASH,
  CURRENT_TERMS_VERSION,
} from "@/lib/legalVersions";

export { CURRENT_TERMS_EFFECTIVE_DATE, CURRENT_TERMS_SNAPSHOT_HASH, CURRENT_TERMS_VERSION };


export function isCurrentTermsAcceptance(value) {
  return value === CURRENT_TERMS_VERSION;
}

/**
 * A profile satisfies the legal gate only when its recorded acceptance names the
 * exact published version. A missing value is not consent — it is an account
 * that predates versioned acceptance and must be asked, not assumed.
 */
export function hasCurrentTermsAcceptance(profile) {
  return Boolean(profile?.terms_accepted_at) && isCurrentTermsAcceptance(profile?.terms_version);
}

export function legalAcceptanceEvidence(request) {
  const userAgent = request.headers.get("user-agent") || "";
  return {
    acceptance_method: "onboarding_explicit_checkbox",
    terms_snapshot_hash: CURRENT_TERMS_SNAPSHOT_HASH,
    user_agent: userAgent.slice(0, 512) || null,
  };
}
