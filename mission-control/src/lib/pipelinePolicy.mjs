/**
 * Pure policy rules for operational pipeline visibility (A-261).
 * Zero I/O, no server-only imports, 100% unit-testable.
 */

const ACTIVE_VIEWING_STATUSES = new Set(["scheduled", "rescheduled", "confirmed"]);

/**
 * Determine if a viewing appointment is stalled (scheduled time elapsed without completion/cancellation).
 * @param {object} viewing
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isViewingStalled(viewing, now = new Date()) {
  if (!viewing || !viewing.scheduled_at) return false;
  if (!ACTIVE_VIEWING_STATUSES.has(viewing.status)) return false;

  const scheduledTime = new Date(viewing.scheduled_at).getTime();
  const currentTime = new Date(now).getTime();

  return !Number.isNaN(scheduledTime) && currentTime > scheduledTime;
}

/**
 * Clean and format waitlist role for display.
 * @param {string|null} role
 * @returns {string}
 */
export function formatWaitlistRole(role) {
  if (!role) return "General Seeker";
  const map = {
    seeker: "Verified Seeker",
    owner: "Asset Owner",
    broker: "Licensed Broker",
    photographer: "Architectural Photographer",
    researcher: "Spatial Researcher",
  };
  return map[role.toLowerCase()] || role;
}

/**
 * Generates an RFC 4180 compliant CSV string for waitlist exports.
 * @param {Array<object>} rows
 * @returns {string}
 */
export function generateWaitlistCsv(rows = []) {
  const headers = ["ID", "Email", "Target Role", "Membership Tier", "Source", "Registered At"];
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines = [headers.map(escapeCsv).join(",")];

  for (const r of rows) {
    const line = [
      escapeCsv(r.id),
      escapeCsv(r.email),
      escapeCsv(r.role || "seeker"),
      escapeCsv(r.tier || "Founding Member"),
      escapeCsv(r.source || "organic"),
      escapeCsv(r.created_at),
    ].join(",");
    csvLines.push(line);
  }

  return csvLines.join("\n");
}
