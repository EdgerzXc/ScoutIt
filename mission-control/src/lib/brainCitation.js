// A-124 — the Brain's freshness contract, in one place.
//
// THE RULE: an answer must carry its source document AND that document's own
// `updated:` date. A stale Brain is worse than no Brain. Before it was
// embedded, a wrong claim in the vault cost someone opening a file; after, it
// is served as an answer in a confident voice. The citation is the only thing
// that makes a three-month-old answer LOOK three months old.
//
// THE TRAP THIS MODULE EXISTS TO AVOID: `brain_documents.updated_at` is the
// row's own timestamp -- when it was ingested. Citing that would stamp
// "updated today" on a vault document whose frontmatter says 2026-06-24, which
// is worse than showing no date at all: it manufactures freshness. So the
// source document's real date is carried in `brain_documents.source`, encoded
// by the ingester and decoded here, and the two dates are never conflated --
// they get different words ("updated" vs "recorded") because they are
// different facts.

/** Marks a row as ingested from the `_SCOUTIT_BRAIN` vault. */
export const VAULT_SOURCE_PREFIX = "vault:";

/** Past this, an answer is old enough that a reader must be told so. */
export const STALE_AFTER_DAYS = 90;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Encode a vault file's provenance into the single free-text `source` column.
 * `vault:<path>@<YYYY-MM-DD>`, or `vault:<path>` when the file carries no
 * `updated:` frontmatter -- an absent date is recorded as absent, never
 * substituted (Rule 3).
 */
export function formatVaultSource(path, updated) {
  const clean = (path || "").trim();
  if (!clean) return "manual";
  return ISO_DATE.test(updated || "")
    ? `${VAULT_SOURCE_PREFIX}${clean}@${updated}`
    : `${VAULT_SOURCE_PREFIX}${clean}`;
}

/**
 * Decode it again. Returns nulls for anything that is not a vault source, so
 * a manually typed document is never given a vault path it does not have.
 */
export function parseVaultSource(source) {
  const raw = typeof source === "string" ? source.trim() : "";
  if (!raw.startsWith(VAULT_SOURCE_PREFIX)) return { path: null, updated: null };
  const body = raw.slice(VAULT_SOURCE_PREFIX.length);
  const at = body.lastIndexOf("@");
  if (at === -1) return { path: body || null, updated: null };
  const updated = body.slice(at + 1);
  const path = body.slice(0, at);
  return ISO_DATE.test(updated)
    ? { path: path || null, updated }
    : { path: body || null, updated: null };
}

const DAY_MS = 86400000;

function daysBetween(thenISO, now) {
  const then = new Date(`${thenISO}T00:00:00Z`).getTime();
  if (!Number.isFinite(then)) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((today - then) / DAY_MS));
}

/**
 * Plain-language age. Deliberately coarse: the point is that an old answer
 * reads as old, not that a reader does date arithmetic.
 */
export function describeAge(days) {
  if (days === null || days === undefined) return null;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.round(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

/**
 * Build the citation a staff member actually reads.
 *
 * `dateKind` is the honesty of the thing:
 *   "vault"    — the source file's own `updated:` frontmatter. The real answer.
 *   "recorded" — no vault date; this is when the row was written here. Said in
 *                different words so it is never mistaken for the first.
 *   "unknown"  — neither. Shown as unknown, and treated as stale, because an
 *                undated source cannot be asserted to be fresh.
 *
 * @param {{title?:string, source?:string, rowUpdatedAt?:string}} doc
 * @param {Date} [now] injected so the tests pin a fixed instant (Rule 11)
 */
export function buildCitation(doc, now = new Date()) {
  const { path, updated } = parseVaultSource(doc?.source);
  const title = (doc?.title || "").trim() || "Untitled";

  if (updated) {
    const ageDays = daysBetween(updated, now);
    return {
      title,
      path,
      date: updated,
      dateKind: "vault",
      ageDays,
      ageLabel: describeAge(ageDays),
      isStale: ageDays !== null && ageDays > STALE_AFTER_DAYS,
    };
  }

  const rowDate = typeof doc?.rowUpdatedAt === "string" ? doc.rowUpdatedAt.slice(0, 10) : "";
  if (ISO_DATE.test(rowDate)) {
    const ageDays = daysBetween(rowDate, now);
    return {
      title,
      path,
      date: rowDate,
      dateKind: "recorded",
      ageDays,
      ageLabel: describeAge(ageDays),
      isStale: ageDays !== null && ageDays > STALE_AFTER_DAYS,
    };
  }

  return {
    title,
    path,
    date: null,
    dateKind: "unknown",
    ageDays: null,
    ageLabel: null,
    // Unknown freshness is not fresh. An undated source that reads as current
    // is the exact failure this whole module exists to prevent.
    isStale: true,
  };
}

/** One line, for a prompt or a log. Never invents a date. */
export function citationLine(citation) {
  if (!citation) return "";
  const where = citation.path ? `${citation.title} (${citation.path})` : citation.title;
  if (citation.dateKind === "unknown") return `${where} — date unknown`;
  const verb = citation.dateKind === "vault" ? "updated" : "recorded";
  const age = citation.ageLabel ? `, ${citation.ageLabel}` : "";
  return `${where} — ${verb} ${citation.date}${age}`;
}
