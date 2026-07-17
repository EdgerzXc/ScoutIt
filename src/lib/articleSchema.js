// ═══════════════════════════════════════════════════════════════
// UNIVERSAL ARTICLE SCHEMA — the one shape every Intel article uses.
//
// An article body is an array of typed blocks. Any source document
// (a PDF market report, an Excel/CSV data sheet, a pasted memo)
// gets converted into this same block array by /api/intel/ingest,
// stored in Airtable INTEL_CMS.Body_JSON, and rendered by
// src/components/intel/ArticleBlocks.js. One schema, every article.
//
// Block types:
//   { type: "heading",   level: 2|3,        text }
//   { type: "paragraph", text }
//   { type: "quote",     text, cite? }
//   { type: "list",      style: "bullet"|"number", items: [string] }
//   { type: "table",     headers: [string], rows: [[string]] }
//   { type: "stat",      label, value, detail? }
//   { type: "callout",   label?, text }
//   { type: "image",     url, caption? }
//   { type: "divider" }
// ═══════════════════════════════════════════════════════════════

import { z } from "zod";

const headingBlock = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]).default(2),
  text: z.string().min(1),
});

const paragraphBlock = z.object({
  type: z.literal("paragraph"),
  text: z.string().min(1),
});

const quoteBlock = z.object({
  type: z.literal("quote"),
  text: z.string().min(1),
  cite: z.string().optional(),
});

const listBlock = z.object({
  type: z.literal("list"),
  style: z.enum(["bullet", "number"]).default("bullet"),
  items: z.array(z.string().min(1)).min(1),
});

const tableBlock = z.object({
  type: z.literal("table"),
  headers: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())).min(1),
});

const statBlock = z.object({
  type: z.literal("stat"),
  label: z.string().min(1),
  value: z.string().min(1),
  detail: z.string().optional(),
});

const calloutBlock = z.object({
  type: z.literal("callout"),
  label: z.string().optional(),
  text: z.string().min(1),
});

const imageBlock = z.object({
  type: z.literal("image"),
  url: z.string().url(),
  caption: z.string().optional(),
});

const dividerBlock = z.object({ type: z.literal("divider") });

export const articleBlockSchema = z.discriminatedUnion("type", [
  headingBlock,
  paragraphBlock,
  quoteBlock,
  listBlock,
  tableBlock,
  statBlock,
  calloutBlock,
  imageBlock,
  dividerBlock,
]);

export const articleBlocksSchema = z.array(articleBlockSchema).min(1);

// The full article envelope the ingest pipeline produces.
export const ingestedArticleSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  category: z.enum(["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues", "General"]).default("General"),
  intelType: z.enum(["BRIEFING", "MARKET INTEL", "AREA GUIDE", "COMMERCIAL SIGNAL", "INSIGHT"]).default("BRIEFING"),
  city: z.string().optional().default(""),
  excerpt: z.string().optional().default(""),
  lead: z.string().optional().default(""),
  recommendation: z.string().optional().default(""),
  blocks: articleBlocksSchema,
});

/**
 * Parse an Airtable Body_JSON string into a validated block array.
 * Returns null (never throws) when the JSON is absent or malformed,
 * so callers fall back to the legacy BodyParagraph1-3 rendering.
 * @param {string | null | undefined} jsonStr
 * @returns {Array<object> | null}
 */
export function parseArticleBlocks(jsonStr) {
  if (!jsonStr || typeof jsonStr !== "string") return null;
  try {
    const parsed = JSON.parse(jsonStr);
    const result = articleBlocksSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Build a block array from a legacy article (lead + body paragraphs),
 * so old and new articles render through the same component.
 * @param {{ body?: string[] }} article
 * @returns {Array<object>}
 */
export function blocksFromLegacy(article) {
  return (article.body || [])
    .filter(Boolean)
    .map((text) => ({ type: "paragraph", text }));
}

/**
 * Deterministic no-AI fallback: split plain document text into blocks.
 * Short ALL-CAPS/heading-looking lines become headings; "-"/"•" runs
 * become lists; everything else becomes paragraphs.
 * @param {string} text
 * @returns {Array<object>}
 */
export function blocksFromPlainText(text) {
  const blocks = [];
  const chunks = (text || "").replace(/\r\n/g, "\n").split(/\n{2,}/);
  for (const raw of chunks) {
    const chunk = raw.trim();
    if (!chunk) continue;
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const bulletLines = lines.filter((l) => /^[-•*]\s+/.test(l));
    if (lines.length > 1 && bulletLines.length === lines.length) {
      blocks.push({ type: "list", style: "bullet", items: lines.map((l) => l.replace(/^[-•*]\s+/, "")) });
      continue;
    }
    const single = lines.join(" ");
    const isHeadingLike = single.length <= 80 && !/[.!?]$/.test(single) && (single === single.toUpperCase() || /^\d+[.)]\s/.test(single));
    if (isHeadingLike && single.length >= 4) {
      blocks.push({ type: "heading", level: 2, text: single });
    } else {
      blocks.push({ type: "paragraph", text: single });
    }
  }
  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: (text || "").slice(0, 4000) }];
}

/**
 * Deterministic no-AI fallback for tabular data (parsed CSV rows).
 * @param {Array<Array<string>>} rows - first row treated as headers
 * @returns {Array<object>}
 */
export function blocksFromTableRows(rows) {
  const safe = (rows || []).filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim()));
  if (safe.length < 2) return [{ type: "paragraph", text: "This data sheet was empty." }];
  const headers = safe[0].map((h) => String(h ?? ""));
  const MAX_ROWS = 60;
  const body = safe.slice(1, 1 + MAX_ROWS).map((r) => headers.map((_, i) => String(r[i] ?? "")));
  const blocks = [{ type: "table", headers, rows: body }];
  if (safe.length - 1 > MAX_ROWS) {
    blocks.push({ type: "callout", label: "Note", text: `Showing the first ${MAX_ROWS} of ${safe.length - 1} rows from the source sheet.` });
  }
  return blocks;
}

/** Derive a URL-safe slug from a title (Intel slugs are plain text fields, app-writable). */
export function slugifyTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `intel-${Date.now()}`;
}

/** Plain-text preview of a block array (for excerpts). */
export function blocksToPlainText(blocks, maxLen = 280) {
  const out = [];
  for (const b of blocks || []) {
    if (b.type === "paragraph" || b.type === "quote" || b.type === "callout") out.push(b.text);
    if (b.type === "list") out.push(b.items.join(", "));
    if (out.join(" ").length > maxLen) break;
  }
  return out.join(" ").slice(0, maxLen);
}
