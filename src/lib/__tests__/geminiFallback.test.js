import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateWithFallback, GEMINI_MODEL, GEMINI_FALLBACK_MODEL } from "../geminiModel";

// A-124 fix 2, main-site half (owner, 2026-09-11: "proceed with the 4").
// Measured the same day: `gemini-flash-latest` answered 503 "high demand" 3 of 3
// times while `gemini-flash-lite-latest` answered on the same free key. Every
// AI route here used the one model with no second chance, so a busy Google
// meant a failed rewrite, a failed PDF import, a failed CSV mapping.

const apiError = (status) => Object.assign(new Error(`status ${status}`), { status });

function fakeAi(outcomes) {
  const seen = [];
  const generateContent = vi.fn(async (request) => {
    seen.push(request);
    const next = outcomes.shift();
    if (next === undefined) throw new Error("unexpected extra call");
    if (next instanceof Error) throw next;
    return next;
  });
  return { ai: { models: { generateContent } }, seen };
}

const REQUEST = { contents: "Map these headers", config: { responseMimeType: "application/json" } };

describe("generateWithFallback — the free backup model", () => {
  it("uses the -latest aliases, so neither can rot", () => {
    expect(GEMINI_MODEL).toBe("gemini-flash-latest");
    expect(GEMINI_FALLBACK_MODEL).toBe("gemini-flash-lite-latest");
  });

  it("hands the SAME request to the backup when the main model is busy", async () => {
    const { ai, seen } = fakeAi([apiError(503), { text: "ok" }]);
    await expect(generateWithFallback(ai, REQUEST)).resolves.toEqual({ text: "ok" });
    expect(seen.map((r) => r.model)).toEqual(["gemini-flash-latest", "gemini-flash-lite-latest"]);
    expect(seen[1].contents).toBe(REQUEST.contents);
    expect(seen[1].config).toEqual(REQUEST.config);
  });

  it("never spends the backup when the main model answers", async () => {
    const { ai, seen } = fakeAi([{ text: "ok" }]);
    await generateWithFallback(ai, REQUEST);
    expect(seen).toHaveLength(1);
  });

  it("hands over on a retired model, a rate limit, a server error and a dropped connection", async () => {
    for (const failure of [apiError(404), apiError(429), apiError(500), new Error("fetch failed")]) {
      const { ai, seen } = fakeAi([failure, { text: "backup" }]);
      await expect(generateWithFallback(ai, REQUEST)).resolves.toEqual({ text: "backup" });
      expect(seen).toHaveLength(2);
    }
  });

  it("stops on a key or request problem — another model cannot fix it", async () => {
    for (const status of [400, 401, 403]) {
      const { ai, seen } = fakeAi([apiError(status)]);
      await expect(generateWithFallback(ai, REQUEST)).rejects.toMatchObject({ status });
      expect(seen).toHaveLength(1);
    }
  });

  it("surfaces the error when both models fail, so each route's own fallback still runs", async () => {
    const { ai, seen } = fakeAi([apiError(503), apiError(503)]);
    await expect(generateWithFallback(ai, REQUEST)).rejects.toMatchObject({ status: 503 });
    expect(seen).toHaveLength(2);
  });
});

describe("every Gemini route goes through the backup", () => {
  const ROUTES = [
    "src/app/api/ai/rewrite/route.js",
    "src/app/api/ai/promote/route.js",
    "src/app/api/ai/blueprint/route.js",
    "src/app/api/ai/assimilate/route.js",
    "src/app/api/intel/ingest/route.js",
  ];

  it.each(ROUTES)("%s calls generateWithFallback, never the model directly", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    expect(source).toContain("generateWithFallback(");
    expect(source).not.toContain("ai.models.generateContent(");
  });
});
