// ═══════════════════════════════════════════════════════════════════════════════
// THE 5 UNIVERSAL PIPELINE STAGES (A-200)
//
// 1. New Inquiry (connected / pitching / inbound)
// 2. In Discussion (pending / reviewing / invited)
// 3. Tour / Viewing (viewing_scheduled / touring / active appointments)
// 4. Handshake / Won (accepted / closed / active)
// 5. Passed / Archived (declined / withdrawn / expired / reported)
// ═══════════════════════════════════════════════════════════════════════════════

export const PIPELINE_COLUMNS = Object.freeze([
  { id: "connected", ownerLabel: "New Inquiry", brokerLabel: "Connected", statuses: ["connected", "pitching", "inbound"] },
  { id: "pending", ownerLabel: "In Discussion", brokerLabel: "In Discussion", statuses: ["pending", "reviewing", "invited"] },
  { id: "viewing_scheduled", ownerLabel: "Tour / Viewing", brokerLabel: "Tour / Viewing", statuses: ["viewing_scheduled", "touring"] },
  { id: "accepted", ownerLabel: "Handshake / Won", brokerLabel: "Handshake / Won", statuses: ["accepted", "closed", "active"] },
  { id: "declined", ownerLabel: "Passed", brokerLabel: "Declined", statuses: ["declined", "withdrawn", "expired", "reported"] },
]);

export const KNOWN_PIPELINE_STATUSES = new Set(PIPELINE_COLUMNS.flatMap((c) => c.statuses));
export const FALLBACK_PIPELINE_COLUMN_ID = "declined";

/**
 * Maps a deal to its canonical pipeline column ID.
 * If a deal has an active viewing scheduled, it is promoted to 'viewing_scheduled'
 * unless it has already reached a terminal (won or passed) milestone.
 */
export const columnIdForDeal = (deal = {}) => {
  if (deal.hasViewingScheduled && !["accepted", "closed", "active", "declined", "withdrawn", "expired", "reported"].includes(deal.status)) {
    return "viewing_scheduled";
  }
  const status = deal.status;
  if (!KNOWN_PIPELINE_STATUSES.has(status)) return FALLBACK_PIPELINE_COLUMN_ID;
  return PIPELINE_COLUMNS.find((c) => c.statuses.includes(status))?.id || FALLBACK_PIPELINE_COLUMN_ID;
};
