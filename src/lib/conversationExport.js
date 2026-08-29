// ─────────────────────────────────────────────────────────────────────────
// CONVERSATION EXPORT — a party's own copy of their thread (A-043)
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────
// ScoutIt keeps message bodies for CHAT_RETENTION_DAYS after a deal closes
// and then overwrites them. That promise was made on the understanding that
// each party keeps their own copy outside ScoutIt — and until this module
// there was no way to keep one. Verified 2026-08-27: no export route, no
// download control, no transcript generation existed anywhere in the app.
//
// So the rule as implemented read very differently from the rule as
// intended: seven days after close the record was gone for EVERYONE, the two
// people who wrote it included. A party who was defrauded had no copy, and
// neither did we. A-038's evidence-based dispute removal rests on this.
//
// ── WHY PLAIN TEXT ───────────────────────────────────────────────────
// The acceptance is "readable years later and without ScoutIt". A .txt file
// opens on every machine that will exist, needs no renderer, survives being
// emailed to a lawyer, and cannot carry an exploit. A PDF would look nicer
// and adds a dependency between the reader and a library; that trade is not
// worth making for an evidentiary record.
//
// ── WHY THE ENTITLEMENT DECISION IS NOT IN THIS FILE ─────────────────
// `contactRevealed` is an input, never something this module works out. It
// is resolved server-side from `deal_handshakes` by the route. A pure
// formatter that could decide its own masking would be a second definition
// of "the handshake is complete", and the first one is in the database.
// ─────────────────────────────────────────────────────────────────────────

import { maskContactDetails } from "@/lib/contactLeakFilter";
import { CHAT_RETENTION_DAYS } from "@/lib/chatRetention";

/** Matches ChatBox's storage envelope for an uploaded file. */
const ATTACHMENT_PREFIX = "__scoutit_attachment__:";

/** Prefix on every quoted body line. See the forgery note below. */
const QUOTE = "  | ";

const END_MARKER = "--- END OF RECORD ---";

/**
 * What the reader is holding, in the reader's own words. Exported so the UI
 * can show the same sentences at the point of download — a warranty that
 * exists only inside the downloaded file is a warranty nobody read before
 * they needed it.
 */
export const EXPORT_DISCLAIMER_LINES = Object.freeze([
  `ScoutIt keeps the messages in this conversation for ${CHAT_RETENTION_DAYS} days after it closes, then replaces their contents. This file is your own copy and it is not affected by that.`,
  "This copy is yours to keep. Once it leaves ScoutIt it is outside ScoutIt's control and outside any warranty ScoutIt gives — store it somewhere you trust.",
  "ScoutIt is not a party to any agreement made in this conversation.",
]);

const MANILA = "Asia/Manila";

function formatManila(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function manilaDateOnly(value) {
  return formatManila(value).slice(0, 10);
}

function decodeAttachment(body) {
  if (typeof body !== "string" || !body.startsWith(ATTACHMENT_PREFIX)) return null;
  try {
    return JSON.parse(body.slice(ATTACHMENT_PREFIX.length));
  } catch {
    return null;
  }
}

function formatBytes(size) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A sender is named if we know their name, and described by role if we do
 * not. A raw user id is never printed: it identifies nobody to the reader and
 * is an internal key in a document that leaves the building.
 */
function senderLabel(message, participants) {
  const match = participants.find((p) => p && p.id === message.sender_id);
  const role = message.sender_role || match?.role || "participant";
  if (match?.name) return `${match.name} (${role})`;
  return `Unknown ${role}`;
}

/**
 * One namer for every party line in the header. An account with no
 * `user_profiles` row has a null display_name, and interpolating it directly
 * printed "Exported by : null (buyer)" in a document a person keeps for
 * years. A missing name is described, never rendered as the absence itself.
 */
function partyLabel(party) {
  if (!party) return null;
  const role = party.role || "participant";
  return party.name ? `${party.name} (${role})` : `Unnamed ${role}`;
}

function quote(text) {
  return String(text ?? "")
    .split("\n")
    // Every body line carries QUOTE, so no message can produce a line that
    // sits flush-left like one of this document's own structural markers.
    .map((line) => `${QUOTE}${line}`)
    .join("\n");
}

function renderMessage(message, participants, contactRevealed) {
  const when = formatManila(message.created_at);
  const who = senderLabel(message, participants);
  const attachment = decodeAttachment(message.body);

  if (attachment) {
    const size = formatBytes(attachment.size);
    const name = attachment.name || "unnamed file";
    return `[${when}] ${who}\n${QUOTE}[File attached] ${name}${size ? ` (${size})` : ""}`;
  }

  return `[${when}] ${who}\n${quote(maskContactDetails(message.body, contactRevealed))}`;
}

/**
 * Build the downloadable record of one conversation.
 *
 * @param {object} input
 * @param {object} input.deal            { id, propertyTitle, status, createdAt, closedAt }
 * @param {Array}  input.messages        raw `deal_messages` rows, oldest first
 * @param {Array}  input.participants    [{ id, name, role }]
 * @param {string} input.exporterId      who asked for this copy
 * @param {boolean} input.contactRevealed resolved server-side, never inferred here
 * @param {string} input.exportedAt      ISO timestamp of this export
 * @returns {string} the transcript
 */
export function buildTranscript({
  deal = {},
  messages = [],
  participants = [],
  exporterId = null,
  contactRevealed = false,
  exportedAt = new Date().toISOString(),
} = {}) {
  const people = Array.isArray(participants) ? participants.filter(Boolean) : [];
  const exporter = people.find((p) => p.id === exporterId);
  const rows = Array.isArray(messages) ? messages : [];

  const header = [
    "SCOUTIT CONVERSATION RECORD",
    "===========================",
    "",
    `Property        : ${deal.propertyTitle || "Untitled property"}`,
    `Conversation ID : ${deal.id || "unknown"}`,
    `Status          : ${deal.status || "unknown"}`,
    `Opened          : ${formatManila(deal.createdAt)} (Philippine time)`,
    `Closed          : ${deal.closedAt ? `${formatManila(deal.closedAt)} (Philippine time)` : "not closed"}`,
    `Exported        : ${formatManila(exportedAt)} (Philippine time)`,
    `Exported by     : ${partyLabel(exporter) || "a party to this conversation"}`,
    `Participants    : ${
      people.length ? people.map(partyLabel).join(" · ") : "not recorded"
    }`,
  ];

  const about = [
    "",
    "--- ABOUT THIS COPY ---",
    "",
    ...EXPORT_DISCLAIMER_LINES,
  ];

  // Masking is stated in the document itself. A reader five years from now
  // must be able to tell the difference between "they never said it" and
  // "ScoutIt hid it because the handshake had not happened yet".
  if (!contactRevealed) {
    about.push(
      "",
      "Contact details in this conversation are hidden because the two-sided handshake had not been completed at the time of export. They were hidden on screen too — nothing has been removed from this copy that you could see in ScoutIt.",
    );
  }

  const body = rows.length
    ? [
        "",
        `--- CONVERSATION (${rows.length} ${rows.length === 1 ? "message" : "messages"}) ---`,
        "",
        rows.map((m) => renderMessage(m, people, contactRevealed)).join("\n\n"),
      ]
    : ["", "--- CONVERSATION ---", "", "This conversation has no messages."];

  return [...header, ...about, ...body, "", END_MARKER, ""].join("\n");
}

/**
 * A filename that is dated, identifies the thread, and is safe to place in a
 * Content-Disposition header. The property title is NOT used: it is
 * user-controlled text, and a header value is the wrong place to find out.
 */
export function transcriptFilename(deal = {}, exportedAt = new Date().toISOString()) {
  const id = String(deal.id || "conversation").replace(/[^A-Za-z0-9-]/g, "").slice(0, 12) || "conversation";
  return `scoutit-conversation-${id}-${manilaDateOnly(exportedAt)}.txt`;
}

export default buildTranscript;
