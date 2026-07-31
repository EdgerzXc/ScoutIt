// Team Brain — embedding + generation helpers (server-only).
//
// Uses Google's Generative Language API (the app already ships GEMINI_API_KEY):
//   • text-embedding-004  → 768-dim embeddings (matches brain_chunks.embedding)
//   • gemini-2.0-flash    → answer synthesis
//
// Every function degrades gracefully: if no key is set, embed()/generateAnswer()
// return null and the Brain falls back to keyword search with no AI summary.

const GEMINI_KEY = process.env.GEMINI_API_KEY || null;
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBED_MODEL = "models/text-embedding-004";
const GEN_MODEL = "models/gemini-2.0-flash";

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
      }),
    });
    if (!res.ok) {
      console.error("brain.embed failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    const values = json?.embedding?.values;
    return Array.isArray(values) && values.length ? values : null;
  } catch (err) {
    console.error("brain.embed error:", err);
    return null;
  }
}

/**
 * Synthesize an answer grounded in the retrieved chunks. Returns null if no
 * key or on error, so the UI shows raw sources instead.
 * @param {string} question
 * @param {{title:string, content:string}[]} contexts
 */
export async function generateAnswer(question, contexts) {
  if (!GEMINI_KEY || !contexts?.length) return null;

  const sources = contexts
    .map((c, i) => `[Source ${i + 1} — ${c.title}]\n${c.content}`)
    .join("\n\n");

  const prompt = `You are the ScoutIt Team Brain, an internal assistant for staff running the ScoutIt platform. Answer the question using ONLY the sources below. If the sources do not contain the answer, say so plainly and suggest what to document. Be concise and practical. Cite sources inline as [Source N].

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
  return chunks.flatMap((c) =>
    c.length <= target * 1.5
      ? [c]
      : c.match(new RegExp(`[\\s\\S]{1,${target}}`, "g")) || [c]
  );
}
