// CRM CONTACT IMPORT MERGE (A-234)
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────
//
// The lead import wrote through PostgREST's `onConflict: "owner_user_id,email"`.
// The database's uniqueness for this table is a PARTIAL EXPRESSION index:
//
//   crm_contacts_owner_email_unique ON (owner_user_id, lower(email)) WHERE email IS NOT NULL
//
// PostgREST cannot point an ON CONFLICT clause at that index, so every batch
// died with PostgreSQL 42P10 ("there is no unique or exclusion constraint
// matching the ON CONFLICT specification") and the imported leads were lost —
// while the interface reported a successful import.
//
// The decision "does this row create a contact or update one the account
// already has" is therefore made here, as pure functions, and the route
// applies the plan. Same rule in the route and in the tests.
//
// ── MERGE RULE (deliberate, so it can be explained) ───────────────────────
//
// * A row WITH an email matches an existing contact case-insensitively
//   (`John@Example.com` matches `john@example.com`).
// * Incoming non-empty values REPLACE the stored value for that field — the
//   file is the newer statement about the person.
// * Stored values the file does not carry SURVIVE. A re-import never deletes
//   notes, budget or company because the CSV omitted them.
// * A row WITHOUT an email cannot conflict (the index excludes NULL emails),
//   so it always creates.
// * A duplicate inside one batch is skipped, not applied twice.

import { KNOWN_PIPELINE_STATUSES } from "@/lib/deals/dealStages";

export const IMPORT_SOURCE = "csv_import";

/** The pipeline stage an imported lead is placed in when none is stated. */
export const DEFAULT_IMPORT_STAGE = "connected";

/**
 * The stage a CSV carried, if it is a stage ScoutIt actually has.
 *
 * An import from another CRM carries the pipeline stage of every lead, and
 * dropping it would put a "Closed Won" lead in New Inquiry. Only the
 * platform's own statuses are accepted, so a spreadsheet cannot invent a
 * stage the pipeline does not have.
 */
export function normaliseImportStage(stage) {
  const value = String(stage || "").trim().toLowerCase();
  if (!value) return DEFAULT_IMPORT_STAGE;
  return KNOWN_PIPELINE_STATUSES.has(value) ? value : DEFAULT_IMPORT_STAGE;
}

/** Case-insensitive match key for an email. Null when there is no email. */
export function contactKey(email) {
  const s = String(email ?? "").trim().toLowerCase();
  return s.length > 0 ? s : null;
}

/** True for a value that carries information (not null/undefined/empty). */
function present(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

/** Keeps only the keys that actually carry a value. */
function definedOnly(obj) {
  const out = {};
  if (!obj || typeof obj !== "object") return out;
  for (const [key, value] of Object.entries(obj)) {
    if (present(value)) out[key] = value;
  }
  return out;
}

/**
 * Normalises one imported lead into a database row shape.
 * `owner_user_id` is applied by the caller — it is never taken from input.
 */
export function contactRowFromInput(item = {}, ownerUserId = null) {
  const email = item.email ? String(item.email).trim().toLowerCase() : null;
  const phone = item.phone ? String(item.phone).trim() : null;
  const rawType = String(item.contactType || item.contact_type || item.role || "prospective_tenant").toLowerCase();
  const requirements = definedOnly({
    budget: item.budget ? Number(item.budget) || null : null,
    propertyTitle: item.propertyTitle || item.property_title || null,
    notes: item.notes || item.lastMessage || null,
    // The stage the spreadsheet carried. A-234: it used to be dropped on
    // import, which put every lead in New Inquiry regardless of where the
    // owner's own pipeline had it.
    stage: normaliseImportStage(item.stage || item.status),
  });
  return {
    owner_user_id: ownerUserId,
    full_name: String(item.fullName || item.full_name || item.name || email || phone || "Imported Contact").trim(),
    email,
    phone,
    company_name: item.companyName || item.company_name || item.company || null,
    contact_type: rawType,
    source: item.source || IMPORT_SOURCE,
    requirements,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Merges an incoming row onto an existing contact row.
 * The stored record keeps everything the incoming row does not contradict.
 */
export function mergeContactFields(existing = {}, incoming = {}) {
  const existingRequirements = definedOnly(existing.requirements);
  const incomingRequirements = definedOnly(incoming.requirements);
  return {
    full_name: present(incoming.full_name) ? incoming.full_name : existing.full_name,
    email: existing.email || incoming.email,
    phone: present(incoming.phone) ? incoming.phone : existing.phone,
    company_name: present(incoming.company_name) ? incoming.company_name : existing.company_name,
    contact_type: present(incoming.contact_type) ? incoming.contact_type : existing.contact_type,
    source: existing.source || incoming.source,
    // Field-by-field: the file's value wins where it has one, the stored
    // value survives where it does not.
    requirements: { ...existingRequirements, ...incomingRequirements },
    updated_at: new Date().toISOString(),
  };
}

/**
 * Decides, for every incoming row, whether it creates or updates.
 *
 * @param {Array<object>} existingContacts contacts already owned by the account
 * @param {Array<object>} incomingRows normalised incoming rows
 * @returns {Array<{action: "create"|"update"|"skip", row: object, existing?: object, merged?: object, reason?: string}>}
 */
export function planContactMerge(existingContacts = [], incomingRows = []) {
  const byKey = new Map();
  for (const contact of existingContacts || []) {
    const key = contactKey(contact?.email);
    if (key && !byKey.has(key)) byKey.set(key, contact);
  }

  const seen = new Set();
  const plan = [];

  for (const row of incomingRows || []) {
    const key = contactKey(row?.email);
    if (key) {
      if (seen.has(key)) {
        plan.push({ action: "skip", row, reason: "duplicate_in_batch" });
        continue;
      }
      seen.add(key);
    }
    const existing = key ? byKey.get(key) : null;
    if (existing) {
      plan.push({ action: "update", row, existing, merged: mergeContactFields(existing, row) });
    } else {
      plan.push({ action: "create", row, merged: { ...row } });
    }
  }

  return plan;
}

/**
 * Turns a stored contact into a pipeline card the CRM board can render.
 * The id is prefixed so a contact record can never be mistaken for a deal
 * (and can never be sent to a deal route by accident).
 */
export function contactToPipelineCard(contact = {}, myRole = "owner") {
  const requirements = contact.requirements || {};
  return {
    id: `contact:${contact.id}`,
    contactId: contact.id,
    // The stage the imported record carried, not a guess.
    status: normaliseImportStage(requirements.stage),
    propertyTitle: requirements.propertyTitle || "Imported lead",
    otherParty: contact.full_name || "Imported Contact",
    otherPartyEmail: contact.email || "",
    otherPartyPhone: contact.phone || "",
    // The seeker's budget, never a listing price. `propertyPrice` is what the
    // pipeline-value KPI sums, and an imported budget is not a listed price —
    // putting it there would invent a number.
    budget: requirements.budget ?? null,
    myRole,
    lastMessage: requirements.notes || "",
    createdAt: contact.created_at || null,
    lastActivityAt: contact.updated_at || contact.created_at || null,
    private_notes: "",
    source: contact.source || IMPORT_SOURCE,
    isImportedContact: true,
  };
}

export default planContactMerge;
