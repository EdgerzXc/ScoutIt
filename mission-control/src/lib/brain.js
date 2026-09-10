// Team Brain — embedding + generation helpers (server-only).
//
// Uses Google's Generative Language API (the app already ships GEMINI_API_KEY).
// Every function degrades gracefully: if no key is set, embed()/generateAnswer()
// return null and the Brain falls back to keyword search with no AI summary.
//
// ── A-124: THE TWO MODELS HAVE OPPOSITE REQUIREMENTS ─────────────────────
//
// GENERATION must float. `gemini-2.0-flash` was hardcoded here, which is the
// exact shape that broke every AI route in the main app in July 2026 when
// Google retired `gemini-2.5-flash` for new API keys. That app's fix lives in
// `src/lib/geminiModel.js` and is mirrored below: a `-latest` alias that cannot
// rot, overridable per-deploy. Mission Control never received it. It is
// duplicated rather than imported because this app must build standalone —
// "include files outside the root directory" is OFF after the 2026-08-30
// outage, so a cross-root import would break the Vercel build.
//
// EMBEDDING must NOT float, and this is not an oversight:
//
//   1. `brain_chunks.embedding` is `vector(768)`. A different model can emit a
//      different width — `gemini-embedding-001` defaults to 3072 — and every
//      insert would fail at the database with an opaque error.
//   2. Worse, and silently: vectors from two different models are not
//      comparable. Mixing them in one index does not error, it just makes
//      similarity meaningless. Changing this value means re-embedding the
//      ENTIRE corpus, not shipping a new string.
//
// So the embedding model is pinned deliberately, the override exists for a
// planned migration rather than for drift, and `embed()` refuses any vector
// that is not EMBED_DIMENSIONS wide — because failing here, with a named
// reason, beats failing inside Postgres.

const GEMINI_KEY = process.env.GEMINI_API_KEY || null;
const BASE = "https://generativelanguage.googleapis.com/v1beta";

// Floats on purpose. Mirrors src/lib/geminiModel.js in the main app.
const GEN_MODEL = `models/${process.env.GEMINI_MODEL || "gemini-flash-latest"}`;

// Pinned on purpose. Changing it requires re-embedding every stored chunk and
// rebuilding the ivfflat index — see A-124.
//
// CORRECTED 2026-09-10, BEFORE THE FIRST INGESTION, and this is Standing Rule
// 15 earning its place again. The pin was `text-embedding-004`, chosen because
// it emits 768 dimensions natively. Called with this project's real key it
// returns **404 — not found for API version v1beta**: Google has retired it for
// new keys, exactly as it retired `gemini-2.5-flash` in July 2026. The failure
// would have been SILENT — embed() returns null on a non-ok response and the
// Brain falls back to keyword-only — so nobody would have seen an error. The
// Brain would simply never have been semantic.
//
// `gemini-embedding-001` is what the key actually has. It defaults to 3072
// dimensions, which `vector(768)` cannot hold — but it is a Matryoshka model,
// so `outputDimensionality` asks for 768 up front rather than truncating after
// the fact. Verified live against the API: status 200, 768 values returned.
//
// A truncated Matryoshka vector is NOT unit length (measured: 0.58), so it is
// re-normalised below. Cosine distance is scale-invariant and
// `match_brain_chunks` uses `<=>`, so this changes no ranking today — it means
// a future switch to inner-product similarity cannot silently mis-rank.
const EMBED_MODEL = `models/${process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001"}`;
export const EMBED_DIMENSIONS = 768;

/**
 * Scale to unit length, then to the precision the database can actually hold.
 *
 * `pgvector` stores float4 — about 7 significant digits — so the 17 a JavaScript
 * division produces are discarded on write. They are still SENT, though, and
 * that is not free: a batch of 25 chunk rows measured 429 KB with full
 * precision against ~170 KB trimmed, which is the difference between a request
 * PostgREST accepts and one it rejects as "Empty or invalid json" — a
 * body-size refusal wearing a parse error's message. The ingester applies the
 * identical transform, so a stored vector and a query vector are produced the
 * same way.
 *
 * A zero vector is returned untouched, not divided by 0.
 */
function normalize(values) {
  let sum = 0;
  for (const v of values) sum += v * v;
  const norm = Math.sqrt(sum);
  if (!Number.isFinite(norm) || norm === 0) return values;
  return values.map((v) => Number((v / norm).toPrecision(7)));
}

export function brainHasAI() {
  return !!GEMINI_KEY;
}

/**
 * Embed a single string → number[768], or null if unavailable / on error.
 * Callers must treat null as "keyword-only mode", never crash.
 */
export async function embed(text) {
  if (!GEMINI_KEY || !text?.trim()) return null;
  try {
    const res = await fetch(`${BASE}/${EMBED_MODEL}:embedContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBED_MODEL,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        // Asked for, never truncated after the fact -- see the note above.
        outputDimensionality: EMBED_DIMENSIONS,
      }),
    });
    if (!res.ok) {
      console.error("brain.embed failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    const values = json?.embedding?.values;
    if (!Array.isArray(values) || !values.length) return null;

    // A-124: refuse a width the column cannot hold. Without this the mismatch
    // surfaces as a Postgres error on insert, far from the cause — and a
    // partially-embedded corpus is worse than an unembedded one, because
    // similarity search over mixed widths fails silently rather than loudly.
    if (values.length !== EMBED_DIMENSIONS) {
      console.error(
        `brain.embed dimension mismatch: ${EMBED_MODEL} returned ${values.length}, ` +
          `brain_chunks.embedding is vector(${EMBED_DIMENSIONS}). Refusing to store. ` +
          `Changing the embedding model requires re-embedding the whole corpus (A-124).`
      );
      return null;
    }
    return normalize(values);
  } catch (err) {
    console.error("brain.embed error:", err);
    return null;
  }
}

/**
 * Synthesize an answer grounded in the retrieved chunks. Returns null if no
 * key or on error, so the UI shows raw sources instead.
 * @param {string} question
 * A-124 freshness contract: every source is labelled with its own date before
 * the model ever sees it, and the model is told to say so when it leans on an
 * old one. The UI shows the same dates independently -- the prompt is the
 * model's half of the contract, not the guarantee.
 *
 * @param {{title:string, content:string, citation?:string}[]} contexts
 */
export async function generateAnswer(question, contexts) {
  if (!GEMINI_KEY || !contexts?.length) return null;

  const sources = contexts
    .map((c, i) => `[Source ${i + 1} — ${c.citation || c.title}]\n${c.content}`)
    .join("\n\n");

  const prompt = `You are the ScoutIt Team Brain, an internal assistant for staff running the ScoutIt platform. Answer the question using ONLY the sources below. If the sources do not contain the answer, say so plainly and suggest what to document. Be concise and practical. Cite sources inline as [Source N].

Each source header carries the date that document was last updated. This matters more than it looks: the vault drifts, and an answer built on an old document must say so. If the source you rely on is months old, or its date is unknown, state that in one short clause beside the claim. Never present an old document's claim as current fact, and never state a date that does not appear in a source header.

Question: ${question}

Sources:
${sources}

Answer:`;

  try {
    const res = await fetch(`${BASE}/${GEN_MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
      }),
    });
    if (!res.ok) {
      console.error("brain.generateAnswer failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    const parts = json?.candidates?.[0]?.content?.parts;
    const text = parts?.map((p) => p.text).join("").trim();
    return text || null;
  } catch (err) {
    console.error("brain.generateAnswer error:", err);
    return null;
  }
}

/**
 * Split a document into ~800-char chunks on paragraph/sentence boundaries.
 * Deterministic and dependency-free.
 */
export function chunkText(text, target = 800) {
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
  // Hard-split any monster chunk that has no paragraph breaks.
  // The `u` flag is load-bearing, not tidiness. Without it `[sS]` matches a
  // single UTF-16 code unit, so a hard split at a fixed count can land BETWEEN
  // the two halves of an astral character -- and the vault is full of emoji.
  // The resulting lone surrogate is not valid UTF-8, JSON.stringify emits it
  // as an unpaired lone surrogate escape, and PostgREST rejects the batch as
  // "Empty or invalid json" -- a mojibake failure wearing a parse error's
  // message. Found by bisecting a real document (00_START_HERE.md, chunk 34).
  // With `u`, the class matches whole code points and a pair cannot be cut.
  return chunks.flatMap((c) =>
    c.length <= target * 1.5
      ? [c]
      : c.match(new RegExp(`[\\s\\S]{1,${target}}`, "gu")) || [c]
  );
}
