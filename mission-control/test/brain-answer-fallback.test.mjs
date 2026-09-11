import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// ── A-124 fix 2 — the Brain must still answer when Gemini's main model is busy ──
//
// Measured 2026-09-11: `gemini-flash-latest` returned 503 "high demand" on 3 of 3
// tries while `gemini-flash-lite-latest` answered on the same free key. With no
// fallback, staff saw sources and no written answer. The backup is a second
// Gemini model on the SAME key: free, no new account, no data leaves Google.
//
// brain.js reads its env at import, so the env is set before the import.
process.env.GEMINI_API_KEY = "test-key";
delete process.env.GEMINI_MODEL;
delete process.env.GEMINI_FALLBACK_MODEL;

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const { generateAnswer } = await import(pathToFileURL(resolve(process.cwd(), "src/lib/brain.js")).href);

const CONTEXTS = [{ title: "Refunds", citation: "Refunds (updated 2026-09-11)", content: "Refunds take 7 days." }];
const ok = (text) => ({ status: 200, body: { candidates: [{ content: { parts: [{ text }] } }] } });
const modelOf = (url) => url.match(/models\/([^:]+):generateContent/)?.[1];

function mockFetch(responses) {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(modelOf(String(url)));
    const next = responses.shift();
    if (!next) throw new Error("unexpected extra call");
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.body ?? { error: {} }), { status: next.status });
  };
  return calls;
}

test("a busy main model hands over to the backup, and says which one answered", async () => {
  const calls = mockFetch([{ status: 503 }, ok("Seven days.")]);
  const result = await generateAnswer("How long do refunds take?", CONTEXTS);
  assert.deepEqual(result, { text: "Seven days.", model: "gemini-flash-lite-latest" });
  assert.deepEqual(calls, ["gemini-flash-latest", "gemini-flash-lite-latest"]);
});

test("a working main model answers alone — the backup is never spent", async () => {
  const calls = mockFetch([ok("Seven days.")]);
  const result = await generateAnswer("How long do refunds take?", CONTEXTS);
  assert.deepEqual(result, { text: "Seven days.", model: "gemini-flash-latest" });
  assert.deepEqual(calls, ["gemini-flash-latest"]);
});

test("a retired model (404), a rate limit (429) and a dropped connection all fall back", async () => {
  for (const failure of [{ status: 404 }, { status: 429 }, new Error("socket hang up")]) {
    const calls = mockFetch([failure, ok("Backup answer.")]);
    const result = await generateAnswer("q", CONTEXTS);
    assert.equal(result?.model, "gemini-flash-lite-latest", `fell back after ${failure.status ?? failure.message}`);
    assert.equal(calls.length, 2);
  }
});

test("an empty or blocked reply is not an answer — the backup gets a turn", async () => {
  const empty = { status: 200, body: { candidates: [{ content: { parts: [] } }] } };
  const calls = mockFetch([empty, ok("Backup answer.")]);
  const result = await generateAnswer("q", CONTEXTS);
  assert.deepEqual(result, { text: "Backup answer.", model: "gemini-flash-lite-latest" });
  assert.equal(calls.length, 2);
});

test("a key or request problem stops — another model cannot fix it", async () => {
  for (const status of [400, 401, 403]) {
    const calls = mockFetch([{ status }]);
    assert.equal(await generateAnswer("q", CONTEXTS), null, `status ${status}`);
    assert.equal(calls.length, 1, `status ${status} must not spend the backup`);
  }
});

test("when every model fails, the Brain returns nothing instead of crashing", async () => {
  const calls = mockFetch([{ status: 503 }, { status: 503 }]);
  assert.equal(await generateAnswer("q", CONTEXTS), null);
  assert.equal(calls.length, 2);
});

test("the backup floats like the main model, so it cannot rot either", () => {
  const code = read("src/lib/brain.js");
  assert.match(
    code,
    /FALLBACK_GEN_MODEL = `models\/\$\{process\.env\.GEMINI_FALLBACK_MODEL \|\| "gemini-flash-lite-latest"\}`/
  );
});

test("the console tells staff which model answered", () => {
  assert.match(read("src/app/dashboard/brain/actions.js"), /answeredBy/);
  assert.match(read("src/app/dashboard/brain/BrainSearch.js"), /answeredBy/);
});
