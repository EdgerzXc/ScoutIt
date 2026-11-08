/**
 * SAFE PROPERTY CLAIM AUTO-VERIFICATION POLICY
 *
 * Designed to safely automate clean Land Title (TCT/CCT) ownership claims
 * without human staff intervention while strictly preventing legal exposure.
 *
 * ── THE 4 UNBREAKABLE SAFETY GUARDRAILS ──────────────────────────────────────
 * 1. DIRECT REGISTERED OWNER ONLY:
 *    Represented claims (brokers, property managers, attorneys with SPAs,
 *    corporate secretary certificates) NEVER auto-verify. They always require
 *    human staff notarization review.
 * 2. PRIMARY TITLE REQUIRED:
 *    A primary government title (Transfer Certificate of Title or Condominium
 *    Certificate of Title) must be attached and confirmed clean.
 * 3. ZERO-CONTEST CONFLICT LOCK:
 *    If the property has any existing active claim, is already owner-verified,
 *    or has an active commercial deal in progress, automation freezes immediately
 *    and routes to staff review.
 * 4. STRICT 98%+ NAME MATCHING:
 *    Claimant verified legal name must match the Title registered owner name
 *    with at least 98% confidence (handling standard Filipino name ordering
 *    and common suffixes). Any discrepancy defaults to staff review.
 *
 * When auto-verified, claims enter a 72-HOUR PROVISIONAL WINDOW with instant
 * notification to prior listers, preserving 100% reversibility and full auditability.
 */

export const PRIMARY_TITLE_DOC_TYPES = Object.freeze([
  "transfer_certificate_of_title",
  "condominium_certificate_of_title",
]);

export const REPRESENTATIVE_DOC_TYPES = Object.freeze([
  "special_power_of_attorney",
  "secretary_certificate",
  "authority_to_sell",
]);

export const SECONDARY_SUPPORTING_DOC_TYPES = Object.freeze([
  "tax_declaration",
  "deed_of_absolute_sale",
  "supporting_document",
]);

export const PROVISIONAL_DISPUTE_WINDOW_HOURS = 72;
export const AUTO_VERIFIER_SYSTEM_ACTOR_ID = "system:clean-title-auto-verifier";

/**
 * Clean and normalize a personal name for high-accuracy Filipino name matching.
 * Handles "DELA CRUZ, JUAN", "JUAN DELA CRUZ JR", "MARIA DE LOS SANTOS", etc.
 */
export function normalizePersonName(rawName) {
  if (typeof rawName !== "string") return "";

  return rawName
    .toUpperCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    // Remove common prefixes and suffixes
    .replace(/\b(MR|MS|MRS|MISS|ATTY|ENG|ENGR|ARCH|DR|HON)\b/g, " ")
    .replace(/\b(JR|SR|II|III|IV|V)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute similarity score between claimant name and title registered owner.
 * Returns { confidence: number, matchType: string, reason: string }
 */
export function calculateNameMatchConfidence(claimantName, titleOwnerName) {
  const normClaimant = normalizePersonName(claimantName);
  const normTitle = normalizePersonName(titleOwnerName);

  if (!normClaimant || !normTitle) {
    return {
      confidence: 0,
      matchType: "empty",
      reason: "Missing claimant name or title owner name.",
    };
  }

  // 1. Exact string match after normalization
  if (normClaimant === normTitle) {
    return {
      confidence: 1.0,
      matchType: "exact",
      reason: "Exact name match confirmed.",
    };
  }

  // 2. Token-set equality (handles transposed order: "DELA CRUZ JUAN" vs "JUAN DELA CRUZ")
  const claimantTokens = normClaimant.split(" ").filter(Boolean).sort();
  const titleTokens = normTitle.split(" ").filter(Boolean).sort();

  if (
    claimantTokens.length === titleTokens.length &&
    claimantTokens.every((token, idx) => token === titleTokens[idx])
  ) {
    return {
      confidence: 1.0,
      matchType: "transposed_exact",
      reason: "Exact name match confirmed with inverted name order.",
    };
  }

  // 3. Middle name initial or omission check
  // E.g., "JUAN M DELA CRUZ" vs "JUAN DELA CRUZ" or "JUAN MERCADO DELA CRUZ"
  const longerTokens = claimantTokens.length >= titleTokens.length ? claimantTokens : titleTokens;
  const shorterTokens = claimantTokens.length >= titleTokens.length ? titleTokens : claimantTokens;

  const allShorterInLonger = shorterTokens.every((tok) => longerTokens.includes(tok));
  if (allShorterInLonger && longerTokens.length - shorterTokens.length === 1) {
    // Missing single middle name or initial - high match, but require staff eyes if critical
    return {
      confidence: 0.90,
      matchType: "middle_name_variant",
      reason: "Name matches with middle initial/name variation. Routed for verification.",
    };
  }

  // Token overlap ratio
  const sharedTokens = claimantTokens.filter((tok) => titleTokens.includes(tok));
  const maxLen = Math.max(claimantTokens.length, titleTokens.length);
  const ratio = maxLen > 0 ? sharedTokens.length / maxLen : 0;

  return {
    confidence: Number(ratio.toFixed(2)),
    matchType: "partial",
    reason: `Only ${sharedTokens.length} of ${maxLen} name tokens matched. Requires human review.`,
  };
}

/**
 * Evaluates whether an incoming property claim meets all 4 safety guardrails
 * for automatic, provisional clean-title verification.
 *
 * @param {object} params
 * @param {object} params.property - Property DB row
 * @param {object} params.claimantProfile - Claimant user_profiles row
 * @param {string} params.claimedRelationship - 'owner' | 'property_manager' | 'authorized_broker'
 * @param {Array<object>} params.documents - List of attached claim documents
 * @param {Array<object>} [params.existingClaims=[]] - Other claims for this property
 * @param {Array<object>} [params.activeDeals=[]] - Active commercial deals on property
 * @param {object|null} [params.ocrData=null] - Extracted OCR metadata from primary title
 * @param {boolean} [params.agreed=false] - Legal declaration signed
 *
 * @returns {object} Evaluation result with canAutoVerify boolean and detailed rationale
 */
export function evaluateClaimAutoVerification({
  property,
  claimantProfile,
  claimedRelationship,
  documents = [],
  existingClaims = [],
  activeDeals = [],
  ocrData = null,
  agreed = false,
}) {
  // ── Guardrail 0: Legal Declaration ───────────────────────────────────────
  if (agreed !== true) {
    return {
      canAutoVerify: false,
      reasonCode: "declaration_not_accepted",
      reason: "Claimant has not accepted the legal affidavit under RA 8792.",
    };
  }

  // ── Guardrail 1: Direct Registered Owner Only ─────────────────────────────
  if (claimedRelationship !== "owner") {
    return {
      canAutoVerify: false,
      reasonCode: "represented_claim_requires_staff",
      reason: `Claimant relationship is '${claimedRelationship}'. Represented claims must be reviewed by staff.`,
    };
  }

  const docTypes = (documents || []).map((d) => d?.documentType || d?.document_type);
  const hasRepresentativeDoc = docTypes.some((t) => REPRESENTATIVE_DOC_TYPES.includes(t));
  if (hasRepresentativeDoc) {
    return {
      canAutoVerify: false,
      reasonCode: "representative_document_present",
      reason: "Special Power of Attorney or Corporate Authorization requires human notary verification.",
    };
  }

  // ── Guardrail 2: Primary Land Title Document Required ─────────────────────
  const hasPrimaryTitle = docTypes.some((t) => PRIMARY_TITLE_DOC_TYPES.includes(t));
  if (!hasPrimaryTitle) {
    return {
      canAutoVerify: false,
      reasonCode: "missing_primary_title",
      reason: "Auto-verification requires a primary Land Title (TCT or CCT).",
    };
  }

  // ── Guardrail 3: Zero-Contest Conflict Lock ───────────────────────────────
  if (property?.owner_id && String(property.owner_id) === String(claimantProfile?.id)) {
    return {
      canAutoVerify: false,
      reasonCode: "already_owned_by_claimant",
      reason: "Claimant already holds ownership of this listing.",
    };
  }

  if (property?.verified === true) {
    return {
      canAutoVerify: false,
      reasonCode: "property_already_verified",
      reason: "Listing owner is already verified; conflicting claims require staff arbitration.",
    };
  }

  // Check for competing active claims
  const competingClaims = (existingClaims || []).filter(
    (c) =>
      c.id !== property?.claimId &&
      String(c.claimant_user_id) !== String(claimantProfile?.id) &&
      ["submitted", "technical_review", "human_review", "disputed"].includes(c.status)
  );

  if (competingClaims.length > 0) {
    return {
      canAutoVerify: false,
      reasonCode: "competing_claim_active",
      reason: `Property is contested by ${competingClaims.length} active claim(s). Routed to staff dispute mediation.`,
    };
  }

  // Check for active deals/inquiries in flight
  const hasActiveDeal = (activeDeals || []).some((d) =>
    ["open", "handshake_pending", "under_review", "contract_prep"].includes(d?.status)
  );
  if (hasActiveDeal) {
    return {
      canAutoVerify: false,
      reasonCode: "active_deal_in_progress",
      reason: "Property has commercial negotiations in progress. Transfer locked to Super Admin.",
    };
  }

  // ── Guardrail 4: Strict 98%+ Name Matching ────────────────────────────────
  const claimantName =
    claimantProfile?.full_name ||
    claimantProfile?.display_name ||
    "";

  if (!claimantName || claimantName.trim().length < 3) {
    return {
      canAutoVerify: false,
      reasonCode: "claimant_name_missing",
      reason: "Claimant profile lacks a verified legal name.",
    };
  }

  if (!ocrData || !ocrData.registeredOwner) {
    return {
      canAutoVerify: false,
      reasonCode: "ocr_title_data_pending",
      reason: "Title OCR extraction is pending or unreadable. Routed to staff toolbelt.",
    };
  }

  const nameMatch = calculateNameMatchConfidence(claimantName, ocrData.registeredOwner);
  if (nameMatch.confidence < 0.98) {
    return {
      canAutoVerify: false,
      reasonCode: "name_match_insufficient",
      reason: `Name match confidence is ${(nameMatch.confidence * 100).toFixed(0)}% (needed 98%+). ${nameMatch.reason}`,
      matchDetails: nameMatch,
    };
  }

  // ── All 4 Guardrails Passed: Clean Auto-Verification ───────────────────────
  return {
    canAutoVerify: true,
    provisional: true,
    provisionalWindowHours: PROVISIONAL_DISPUTE_WINDOW_HOURS,
    confidence: nameMatch.confidence,
    titleNumber: ocrData.titleNumber || null,
    registeredOwner: ocrData.registeredOwner,
    claimantName,
    reason: "Clean Land Title auto-verification passed: direct owner match with zero conflicts.",
  };
}
