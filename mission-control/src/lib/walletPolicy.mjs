/**
 * Pure policy rules for Mission Control Connects Wallet & Ledger (A-257).
 * Zero I/O, no server-only imports, 100% testable.
 */

export const WALLET_ROLES = Object.freeze([
  "seeker",
  "owner",
  "broker",
  "developer",
  "enterprise",
]);

export const TRANSACTION_TYPES = Object.freeze({
  SPEND: "spend",
  GRANT: "grant",
  REFUND: "refund",
  REWARD: "reward",
  PURCHASE: "purchase",
  STAFF_CORRECTION: "staff_correction",
});

export const MAX_REASON_LENGTH = 500;

export function isValidWalletRole(role) {
  return typeof role === "string" && WALLET_ROLES.includes(role);
}

/**
 * Validates a system-error refund request according to A-257 and §38.3 policy:
 * - Amount must be a positive integer <= 500.
 * - Reason must be 10..500 chars explaining verifiable platform fault.
 */
export function validateRefundRequest({ amount, reason }) {
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return { valid: false, error: "Refund amount must be a positive integer." };
  }
  if (amount > 500) {
    return { valid: false, error: "Refund amount exceeds maximum single transaction limit (500 Connects)." };
  }
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason.length < 10) {
    return { valid: false, error: "A detailed reason of at least 10 characters documenting platform error is required." };
  }
  if (trimmedReason.length > MAX_REASON_LENGTH) {
    return { valid: false, error: `Refund reason cannot exceed ${MAX_REASON_LENGTH} characters.` };
  }
  return { valid: true, error: null };
}

/**
 * Validates a discretionary Super Admin grant request.
 */
export function validateGrantRequest({ amount, reason, role = "seeker" }) {
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return { valid: false, error: "Grant amount must be a positive integer." };
  }
  if (amount > 1000) {
    return { valid: false, error: "Discretionary grant exceeds 1,000 Connects threshold." };
  }
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason.length < 5) {
    return { valid: false, error: "A clear reason of at least 5 characters is required for grants." };
  }
  if (trimmedReason.length > MAX_REASON_LENGTH) {
    return { valid: false, error: `Grant reason cannot exceed ${MAX_REASON_LENGTH} characters.` };
  }
  if (!isValidWalletRole(role)) {
    return { valid: false, error: `Invalid wallet role. Expected one of: ${WALLET_ROLES.join(", ")}.` };
  }
  return { valid: true, error: null };
}

/**
 * Formats a transaction type with status colour and human label.
 */
export function formatTransactionKind(kind) {
  switch (kind?.toLowerCase()) {
    case "refund":
      return { label: "Refund", color: "emerald", sign: "+" };
    case "grant":
      return { label: "Monthly Grant", color: "blue", sign: "+" };
    case "purchase":
      return { label: "Pack Purchase", color: "amber", sign: "+" };
    case "reward":
      return { label: "Earned Reward", color: "purple", sign: "+" };
    case "spend":
      return { label: "Connects Spent", color: "rose", sign: "-" };
    case "staff_correction":
      return { label: "Staff Correction", color: "red", sign: "" };
    case "reversal":
      return { label: "Ledger Reversal", color: "red", sign: "-" };
    default:
      return { label: kind || "Transaction", color: "neutral", sign: "" };
  }
}
