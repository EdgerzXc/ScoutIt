/**
 * Pure policy rules for RA 10173 Data Subject Requests & Account Deletion Oversight (A-262).
 * Zero I/O, no server-only imports, 100% testable.
 */

export const DSR_SLA_DAYS = 15; // Statutory 15-day SLA under RA 10173 §16
const DAY_MS = 24 * 60 * 60 * 1000;

export const DSR_TYPES = Object.freeze({
  ACCESS: "access",             // RA 10173 §16(c) Right to Access
  RECTIFICATION: "rectification", // RA 10173 §16(d) Right to Correct
  ERASURE: "erasure",           // RA 10173 §16(e) Right to Erasure / Blocking
  PORTABILITY: "portability",   // RA 10173 §18 Data Portability
  INQUIRY: "privacy_inquiry",   // General Privacy Policy Inquiry
});

export const DSR_STATUSES = Object.freeze({
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
});

/**
 * Mask a user UUID into a non-PII token for privacy audit logs.
 * @param {string|null} userId
 * @returns {string}
 */
export function maskUserId(userId) {
  if (!userId || typeof userId !== "string") return "USR-ANON-0000";
  const clean = userId.replace(/[^a-zA-Z0-9]/g, "");
  const tail = clean.slice(-4) || "0000";
  return `USR-***-${tail.toUpperCase()}`;
}

/**
 * Calculates SLA deadline and countdown status.
 * @param {string|Date} createdAt
 * @param {number} [slaDays=15]
 * @param {Date} [now]
 * @returns {{ deadline: string, daysRemaining: number, isBreached: boolean, isUrgent: boolean }}
 */
export function calculateSlaStatus(createdAt, slaDays = DSR_SLA_DAYS, now = new Date()) {
  if (!createdAt) {
    return { deadline: "", daysRemaining: 0, isBreached: false, isUrgent: false };
  }

  const start = new Date(createdAt).getTime();
  const current = new Date(now).getTime();
  if (Number.isNaN(start) || Number.isNaN(current)) {
    return { deadline: "", daysRemaining: 0, isBreached: false, isUrgent: false };
  }

  const deadlineTime = start + slaDays * DAY_MS;
  const daysRemaining = Math.ceil((deadlineTime - current) / DAY_MS);
  const isBreached = daysRemaining < 0;
  const isUrgent = daysRemaining >= 0 && daysRemaining <= 3;

  return {
    deadline: new Date(deadlineTime).toISOString(),
    daysRemaining,
    isBreached,
    isUrgent,
  };
}

/**
 * Checks whether an incoming contact message relates to Data Privacy / DSRs.
 * @param {string} subject
 * @param {string} message
 * @returns {boolean}
 */
export function isPrivacySubject(subject = "", message = "") {
  const text = `${subject} ${message}`.toLowerCase();
  const patterns = [
    /\bprivacy\b/,
    /\bdata subject\b/,
    /\beras(e|ure)\b/,
    /\bdelet(e|ion)\b/,
    /\brectif/,
    /\bra\s*10173\b/,
    /\bdpa\b/,
    /\bgdpr\b/,
    /\bpersonal data\b/,
    /\bright to access\b/,
  ];
  return patterns.some((p) => p.test(text));
}

/**
 * Detect DSR type from text.
 * @param {string} subject
 * @param {string} message
 * @returns {string}
 */
export function detectDsrType(subject = "", message = "") {
  const text = `${subject} ${message}`.toLowerCase();
  if (text.includes("delete") || text.includes("erase") || text.includes("erasure") || text.includes("blocking")) {
    return DSR_TYPES.ERASURE;
  }
  if (text.includes("correct") || text.includes("rectif") || text.includes("update details")) {
    return DSR_TYPES.RECTIFICATION;
  }
  if (text.includes("access") || text.includes("copy of data") || text.includes("export")) {
    return DSR_TYPES.ACCESS;
  }
  return DSR_TYPES.INQUIRY;
}
