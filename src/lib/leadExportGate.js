// ═══════════════════════════════════════════════════════════════
// ScoutIt Lead Export Audit Feature Gate
//
// Governs runtime activation of server-side lead export auditing.
// Server-only, opt-in default-false gate.
// ═══════════════════════════════════════════════════════════════

/**
 * Returns true only if the lead export audit log feature is explicitly enabled.
 */
export function isLeadExportAuditActive() {
  return process.env.LEAD_EXPORT_AUDIT_ACTIVE === "true";
}
