// ═══════════════════════════════════════════════════════════════
// LEAD EXPORT  (NEW_IDEAS.md §8, redesigned)
//
// The original spec called for a webhook dispatcher pushing leads into
// HubSpot / Salesforce / Zoho. That was reconsidered on 2026-07-29 and
// deliberately NOT built. Reasoning, so nobody "fixes" it back:
//
//   A webhook pipeline makes ScoutIt a feeder into someone else's system of
//   record. Every hour a broker spends working leads inside HubSpot is an
//   hour reinforcing that HubSpot is where the work happens and ScoutIt is
//   plumbing. The strategic goal is the opposite — ScoutIt's own CRM should
//   be where they live, and the export exists only to unblock brokers whose
//   firm still mandates a legacy CRM.
//
//   Copy-paste is therefore a FEATURE, not a compromise. It's deliberately
//   just good enough: no keys, no config, no maintenance, no dependency
//   deepened. It also costs nothing and can never silently lose a lead the
//   way a failed webhook can.
//
// ── PRIVACY ─────────────────────────────────────────────────────────
// A lead export carries a real person's contact details out of ScoutIt.
// Only fields the buyer knowingly submitted are included, and only once a
// handshake has actually been accepted — the same gate that reveals contact
// details in the UI. Never export a pending lead's contact info.
// ═══════════════════════════════════════════════════════════════

/** Escapes one CSV cell per RFC 4180. */
function csvCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  // A leading =, +, - or @ makes Excel and Sheets treat the cell as a
  // formula. A lead named "=cmd|..." becoming an executable formula is a
  // real injection path into the broker's spreadsheet.
  const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export const CSV_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "property", label: "Property" },
  { key: "propertyUrl", label: "Property URL" },
  { key: "budget", label: "Budget" },
  { key: "status", label: "Status" },
  { key: "message", label: "Message" },
  { key: "createdAt", label: "Date" },
  { key: "source", label: "Source" },
];

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Normalises whatever shape a lead arrives in (deal row, pitch, inquiry)
 * into the flat record every export format reads.
 */
export function normaliseLead(lead = {}) {
  const contact = lead.buyerContact || lead.contact || {};
  return {
    name: lead.name || contact.name || lead.buyerName || "",
    email: lead.email || contact.email || "",
    phone: lead.phone || contact.phone || "",
    property: lead.propertyTitle || lead.property?.title || lead.targetListing?.title || "",
    propertyUrl: lead.propertyUrl || (lead.propertySlug ? `https://scoutit.ph/property/${lead.propertySlug}` : ""),
    budget: lead.budget || "",
    status: lead.status || "",
    message: lead.pitchMessage || lead.pitch_message || lead.message || "",
    createdAt: fmtDate(lead.createdAt || lead.created_at),
    source: "ScoutIt",
  };
}

/**
 * CSV for a bulk export — opens straight into Excel, Sheets, or any CRM's
 * import wizard. This is the path that actually replaces a webhook.
 *
 * @param {Array<object>} leads
 * @returns {string}
 */
export function leadsToCsv(leads = []) {
  const rows = (leads || []).map(normaliseLead);
  const header = CSV_COLUMNS.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((r) => CSV_COLUMNS.map((c) => csvCell(r[c.key])).join(","));
  // CRLF per RFC 4180 — Excel on Windows is fussy about bare LF.
  return [header, ...body].join("\r\n");
}

/**
 * A readable block for pasting into a CRM note, an email, or a chat.
 * Labels are omitted when empty rather than printed as "Phone: —".
 *
 * @param {object} lead
 * @returns {string}
 */
export function leadToText(lead = {}) {
  const r = normaliseLead(lead);
  const lines = [];

  if (r.name) lines.push(r.name);
  if (r.email) lines.push(`Email: ${r.email}`);
  if (r.phone) lines.push(`Phone: ${r.phone}`);
  if (r.property) lines.push(`Property: ${r.property}`);
  if (r.propertyUrl) lines.push(r.propertyUrl);
  if (r.budget) lines.push(`Budget: ${r.budget}`);
  if (r.status) lines.push(`Status: ${r.status}`);
  if (r.createdAt) lines.push(`Received: ${r.createdAt}`);
  if (r.message) lines.push("", `"${r.message}"`);

  lines.push("", "— via ScoutIt");
  return lines.join("\n");
}

/**
 * vCard 3.0 so a lead can be saved straight to a phone's contacts. Brokers
 * work from their phone in the field far more than from a CRM.
 *
 * Returns null when there's nothing to put in a contact card — an empty
 * vCard imports as a blank contact, which is worse than no button.
 *
 * @param {object} lead
 * @returns {string|null}
 */
export function leadToVCard(lead = {}) {
  const r = normaliseLead(lead);
  if (!r.name && !r.email && !r.phone) return null;

  // Escape per RFC 6350: backslash, comma, semicolon, newline.
  const esc = (v) => String(v || "").replace(/([\\,;])/g, "\\$1").replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(r.name || r.email || r.phone)}`,
  ];
  if (r.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(r.email)}`);
  if (r.phone) lines.push(`TEL;TYPE=CELL:${esc(r.phone)}`);
  if (r.property) lines.push(`NOTE:${esc(`ScoutIt lead — ${r.property}${r.propertyUrl ? ` (${r.propertyUrl})` : ""}`)}`);
  lines.push("ORG:ScoutIt Lead", "END:VCARD");

  return lines.join("\r\n");
}

/**
 * Filename for a download. Slug-safe across Windows, macOS and Linux.
 */
export function exportFilename(prefix = "scoutit-leads", ext = "csv") {
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = String(prefix).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${safe || "scoutit-leads"}-${stamp}.${ext}`;
}

export default leadsToCsv;
