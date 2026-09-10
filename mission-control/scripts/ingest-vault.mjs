#!/usr/bin/env node
/**
 * A-124 stage 1 - ingest the canonical `_SCOUTIT_BRAIN` vault into the Brain.
 *
 * Run from the repository root:
 *   node mission-control/scripts/ingest-vault.mjs --dry-run
 *   node mission-control/scripts/ingest-vault.mjs
 *
 * WHAT IS DELIBERATELY NOT INGESTED, and why:
 *   _ARCHIVE/ and INBOX/  - the Strategic Rule of Engagement: unverified noise
 *                           never enters the Brain, and the Inbox is unverified
 *                           by definition.
 *   12_EXTERNAL_TOOLS/    - cloned third-party repositories. Not ScoutIt
 *                           knowledge, and 355 files of it would drown the
 *                           vault's own signal in retrieval.
 *   13_EXTERNAL_INPUTS/   - raw external material, same reason.
 *   15_IMPLEMENTATION_RECORDS/ - historical evidence by design. RULES Part C
 *                           says these cannot assign work; served as answers
 *                           they would assert a past state as the present one.
 *
 * FRESHNESS: each document's own `updated:` frontmatter is carried into
 * `brain_documents.source` as `vault:<path>@<YYYY-MM-DD>` and decoded by
 * `src/lib/brainCitation.js`. The row's `updated_at` is when WE wrote it and is
 * never presented as the document's own date.
 *
 * IDEMPOTENT: a document is keyed by its vault path. Re-running deletes that
 * path's previous row (chunks cascade) and re-inserts, so the Brain converges
 * on the vault instead of accumulating duplicates.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep, basename } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
// Resume is the DEFAULT, because the free-tier daily cap makes a full run a
// multi-day job (see the note beside `pending` below). `--no-resume` forces
// every document to be re-embedded from scratch.
const RESUME = !process.argv.includes("--no-resume");
// `--budget=N` stops before spending more than N embedding requests this run,
// so a day's allowance can be split deliberately instead of discovered.
const BUDGET = (() => {
  const arg = process.argv.find((a) => a.startsWith("--budget="));
  const n = arg ? Number(arg.slice("--budget=".length)) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
})();
const VAULT = "_SCOUTIT_BRAIN";
const EMBED_DIMENSIONS = 768;
const CHUNK_TARGET = 800;
const CONCURRENCY = 2;
const CHUNK_INSERT_BATCH = 10;

/** pgvector is float4. Anything past 7 significant digits is discarded on write. */
const toStorablePrecision = (v) => Number(v.toPrecision(7));

const EXCLUDED_DIRS = new Set([
  "_ARCHIVE",
  "INBOX",
  "12_EXTERNAL_TOOLS",
  "13_EXTERNAL_INPUTS",
  "15_IMPLEMENTATION_RECORDS",
  ".obsidian",
  "node_modules",
]);

// ---------------------------------------------------------------- env

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);
    out[m[1]] = value;
  }
  return out;
}

const env = {
  ...loadEnvFile("mission-control/.env.local"),
  ...loadEnvFile(".env.local"),
  ...process.env,
};

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = env.GEMINI_API_KEY || null;
// Must match mission-control/src/lib/brain.js exactly. Vectors written here
// and query vectors built there are compared to each other; two models, or two
// widths, make every similarity score meaningless without erroring.
const EMBED_MODEL = `models/${env.GEMINI_EMBED_MODEL || "gemini-embedding-001"}`;

// ---------------------------------------------------------------- vault read

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (entry.endsWith(".md")) acc.push(full);
  }
  return acc;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Pull `updated:` out of YAML frontmatter and return the body without it. */
export function parseDocument(raw, relPath) {
  const fm = FRONTMATTER.exec(raw);
  const body = fm ? raw.slice(fm[0].length) : raw;
  let updated = null;
  if (fm) {
    const line = /^\s*updated:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m.exec(fm[1]);
    if (line) updated = line[1];
  }
  const heading = /^#\s+(.+)$/m.exec(body);
  const title = (heading ? heading[1] : basename(relPath, ".md")).trim();
  return { title, updated, body: body.trim() };
}

/** Same algorithm as mission-control/src/lib/brain.js chunkText. */
export function chunkText(text, target = CHUNK_TARGET) {
  const clean = (text || "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];
  let buf = "";
  for (const para of paragraphs) {
    if ((buf + "\n\n" + para).length > target && buf) {
      chunks.push(buf.trim());
      buf = para;
    } else {
      buf = buf ? `${buf}\n\n${para}` : para;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  // The `u` flag is load-bearing, not tidiness. Without it the any-character
  // class matches a single UTF-16 code unit, so a hard split at a fixed count
  // can land BETWEEN the two halves of an astral character -- and the vault is
  // full of emoji. The resulting lone surrogate is not valid UTF-8,
  // JSON.stringify emits it as an unpaired escape, and PostgREST rejects the
  // whole batch as "Empty or invalid json" -- a mojibake failure wearing a
  // parse error's message. Found by bisecting a real document
  // (00_START_HERE.md, chunk 34). With `u`, the class matches whole code
  // points and a pair cannot be cut.
  return chunks.flatMap((c) =>
    c.length <= target * 1.5 ? [c] : c.match(new RegExp(`[\\s\\S]{1,${target}}`, "gu")) || [c]
  );
}

// ---------------------------------------------------------------- embedding

// Pacing, not just retrying. `gemini-embedding-001` on the free tier rate-limits
// far harder than the retired text-embedding-004 did, and a burst of parallel
// requests spends the whole minute's allowance in a second and then backs off
// through it. A gate that admits one request per interval keeps the run inside
// the quota instead of repeatedly discovering it.
const MIN_REQUEST_INTERVAL_MS = Number(env.EMBED_INTERVAL_MS || 700);
let nextSlot = 0;
async function rateLimitGate() {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MIN_REQUEST_INTERVAL_MS;
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
}

/** Google returns the wait it wants in the error body; obey it over guessing. */
function retryDelayFromBody(body) {
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body || "");
  return m ? Math.ceil(Number(m[1]) * 1000) : null;
}

let quotaNoticeShown = false;

async function embed(text, attempt = 0) {
  if (!GEMINI_KEY) return null;
  await rateLimitGate();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${EMBED_MODEL}:embedContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBED_MODEL,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        // Asked for, never truncated after the fact: gemini-embedding-001
        // defaults to 3072, which vector(768) cannot hold.
        outputDimensionality: EMBED_DIMENSIONS,
      }),
    }
  );
  if (res.status === 429 || res.status >= 500) {
    const body = await res.text().catch(() => "");
    if (res.status === 429 && !quotaNoticeShown) {
      quotaNoticeShown = true;
      console.log(`\n  [quota] ${body.replace(/\s+/g, " ").slice(0, 400)}\n`);
    }
    if (attempt >= 8) {
      throw new Error(`embed gave up after ${attempt} retries (${res.status}): ${body.slice(0, 300)}`);
    }
    const wait = retryDelayFromBody(body) ?? Math.min(2 ** attempt * 1000, 60000);
    await new Promise((r) => setTimeout(r, wait));
    return embed(text, attempt + 1);
  }
  if (!res.ok) throw new Error(`embed failed ${res.status}: ${await res.text().catch(() => "")}`);
  const values = (await res.json())?.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBED_DIMENSIONS) {
    // Refuse rather than store a vector the column cannot compare (A-124).
    throw new Error(`embed returned ${values?.length} dims, expected ${EMBED_DIMENSIONS}`);
  }
  // gemini-embedding-001 does not return a unit vector below 3072 dimensions.
  let sum = 0;
  for (const v of values) sum += v * v;
  const norm = Math.sqrt(sum);
  const unit = norm > 0 ? values.map((v) => v / norm) : values;
  // pgvector stores float4 (~7 significant digits), so the 17 digits a JS
  // division produces are thrown away on write -- but they are still SENT,
  // and they triple the request body. A 25-row batch went from 429 KB to
  // ~170 KB with no loss the database could observe.
  return unit.map(toStorablePrecision);
}

async function embedAll(pieces) {
  const out = new Array(pieces.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, pieces.length) }, async () => {
      while (cursor < pieces.length) {
        const i = cursor++;
        out[i] = await embed(pieces[i]);
      }
    })
  );
  return out;
}

// ---------------------------------------------------------------- supabase

async function rest(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${init.method || "GET"} ${path} -> ${res.status} ${await res.text()}`);
  }
  // PostgREST returns an empty body for a write unless Prefer:
  // return=representation is set, so json() on it throws. Read the text and
  // decide, rather than assuming a status code implies a body.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------- main

export function collectDocuments() {
  const files = walk(VAULT).sort();
  return files
    .map((full) => {
      const relPath = relative(".", full).split(sep).join("/");
      const parsed = parseDocument(readFileSync(full, "utf8"), relPath);
      return {
        relPath,
        category: relPath.split("/")[1] || "root",
        ...parsed,
        chunks: chunkText(parsed.body),
      };
    })
    .filter((d) => d.chunks.length > 0);
}

async function main() {
  if (!existsSync(VAULT)) throw new Error(`Run from the repository root: ${VAULT} not found.`);
  if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const docs = collectDocuments();
  const totalChunks = docs.reduce((n, d) => n + d.chunks.length, 0);
  const undated = docs.filter((d) => !d.updated);

  console.log(`Vault documents to ingest : ${docs.length}`);
  console.log(`Chunks                    : ${totalChunks}`);
  console.log(`Missing an updated: date  : ${undated.length}`);
  console.log(`Embedding                 : ${GEMINI_KEY ? EMBED_MODEL : "NONE (keyword-only)"}`);
  if (undated.length) {
    console.log("\nUndated - these cite as date unknown, never as fresh:");
    for (const d of undated.slice(0, 20)) console.log(`  ${d.relPath}`);
    if (undated.length > 20) console.log(`  ... and ${undated.length - 20} more`);
  }

  if (DRY_RUN) {
    console.log("\nDRY RUN - nothing was written.");
    return;
  }
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY is required for a real ingestion run.");

  // Existing vault rows, so a re-run converges instead of duplicating.
  const existing = await rest("brain_documents?select=id,source&source=like.vault:*");
  const idByPath = new Map();
  const sourceByPath = new Map();
  for (const row of existing) {
    const body = row.source.slice("vault:".length);
    const at = body.lastIndexOf("@");
    const path = at === -1 ? body : body.slice(0, at);
    idByPath.set(path, row.id);
    sourceByPath.set(path, row.source);
  }
  console.log(`\nExisting vault documents in the Brain: ${idByPath.size}`);

  // RESUME, because the free tier makes this a multi-day job.
  //
  // `gemini-embedding-001` on the free tier allows 1,000 embed_content requests
  // per DAY (measured live 2026-09-10 — the 429 body names the quota
  // `embed_content_free_tier_requests`, limit 1000). The canonical vault is
  // ~3,300 chunks, so a complete ingestion does not fit in one day unless
  // billing is enabled. Already-ingested documents are skipped rather than
  // re-embedded, and `--budget=N` stops the run before it burns into the next
  // day's allowance.
  //
  // Skipping is safe precisely BECAUSE the source key carries the file's own
  // `updated:` date: a document whose date has changed is re-ingested, and one
  // that has not is left alone.
  const pending = RESUME
    ? docs.filter((d) => {
        const source = d.updated ? `vault:${d.relPath}@${d.updated}` : `vault:${d.relPath}`;
        return sourceByPath.get(d.relPath) !== source;
      })
    : docs;

  if (RESUME && pending.length !== docs.length) {
    console.log(`Unchanged and already ingested       : ${docs.length - pending.length}`);
  }

  let spent = 0;
  let done = 0;
  for (const doc of pending) {
    if (BUDGET !== null && spent + doc.chunks.length > BUDGET) {
      console.log(
        `\nStopping at the ${BUDGET}-embedding budget: ${spent} spent, ` +
          `"${doc.relPath}" needs ${doc.chunks.length} more.`
      );
      console.log(`${pending.length - done} documents remain. Re-run tomorrow to continue.`);
      break;
    }
    spent += doc.chunks.length;
    const previous = idByPath.get(doc.relPath);
    if (previous) await rest(`brain_documents?id=eq.${previous}`, { method: "DELETE" });

    const source = doc.updated ? `vault:${doc.relPath}@${doc.updated}` : `vault:${doc.relPath}`;
    const [inserted] = await rest("brain_documents", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        title: doc.title,
        category: doc.category,
        source,
        content: doc.body,
        created_by: "ingest-vault.mjs (A-124)",
      }),
    });

    const vectors = await embedAll(doc.chunks);
    const rows = doc.chunks.map((content, i) => ({
      document_id: inserted.id,
      chunk_index: i,
      content,
      embedding: vectors[i],
    }));
    // 25, not 100: a 768-float vector is ~15 KB of JSON, so a 100-row batch
    // is ~1.5 MB and PostgREST rejects it as "Empty or invalid json" -- a
    // body-size refusal wearing a parse error's message.
    for (let i = 0; i < rows.length; i += CHUNK_INSERT_BATCH) {
      await rest("brain_chunks", {
        method: "POST",
        body: JSON.stringify(rows.slice(i, i + CHUNK_INSERT_BATCH)),
      });
    }

    done += 1;
    console.log(`[${String(done).padStart(3)}/${pending.length}] ${doc.relPath} (${rows.length} chunks)`);
  }

  const remaining = pending.length - done;
  if (remaining > 0) {
    console.log(`\nIngestion PAUSED: ${done} of ${pending.length} documents written, ${remaining} remain.`);
    console.log("Re-run this script to continue where it stopped.");
    console.log("Do NOT rebuild the ivfflat index until the corpus is complete.");
    return;
  }

  console.log("\nIngestion complete.");
  console.log("NEXT, and it is not optional: rebuild idx_brain_chunks_embedding.");
  console.log("ivfflat derives its clusters from existing rows, so the index built on an");
  console.log("empty table is untrained and recall degrades with no error.");
}

if (process.argv[1]?.endsWith("ingest-vault.mjs")) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
