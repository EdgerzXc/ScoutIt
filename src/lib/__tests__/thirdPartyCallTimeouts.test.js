import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

// A-013 — src/lib/fetchWithRetry.js exists, is tested, and gives every call an
// attempt timeout, a total budget and a circuit breaker. Several routes called
// Airtable and Mapbox with a bare fetch() instead, which has NO timeout at all.
//
// The failure mode is not "upstream is down" — that returns fast and is handled.
// It is "upstream is SLOW": the request holds open until the platform kills the
// function, and the user sees a hang rather than an error.

vi.mock("@/lib/mapboxToken", () => ({ getServerMapboxToken: () => "pk.test" }));

const BYPASSING_FILES = [
  "src/app/api/geo-pricing/route.js",
  "src/app/api/health/route.js",
  "src/app/api/intel/ingest/route.js",
  "src/app/api/dashboard/verify-freshness/route.js",
  "src/lib/intelPublish.js",
];

// src/lib/isochrone.js is deliberately NOT in that list. A-013's first draft
// included it, but reading the code shows fetchContour already wraps its call in
// an AbortController with REQUEST_TIMEOUT_MS. It uses a bare fetch, so it looked
// like the others to a grep, but it is bounded and was never the defect.
// Converting it would buy retries and a circuit breaker, not a timeout — a
// separate judgement call, not this task.
it("isochrone.js is bounded by its own AbortController, not by fetchWithRetry", () => {
  const source = readFileSync("src/lib/isochrone.js", "utf8");

  expect(source).toContain("AbortController");
  expect(source).toContain("controller.abort()");
  expect(source).toContain("signal: controller.signal");
});

describe("no third-party call is left without a timeout", () => {
  it.each(BYPASSING_FILES)("%s imports fetchWithRetry", (file) => {
    expect(readFileSync(file, "utf8")).toContain("fetchWithRetry");
  });

  it.each(BYPASSING_FILES)("%s has no bare fetch to a third party", (file) => {
    const source = readFileSync(file, "utf8");

    // Strip comments so prose about the old behaviour cannot fail the check.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");

    // `await fetch(` / `= fetch(` reaching Airtable or Mapbox is the defect.
    const bare = [...code.matchAll(/(?<![.\w])fetch\s*\(/g)];
    expect(bare).toHaveLength(0);
  });
});

describe("/api/geo-pricing surfaces a slow upstream as an error, not a hang", () => {
  beforeEach(() => {
    process.env.AIRTABLE_BASE_ID = "appTest";
    process.env.AIRTABLE_API_KEY = "keyTest";
  });

  afterEach(() => vi.restoreAllMocks());

  it("returns a handled response when the geocoder never answers", async () => {
    // A fetch that rejects the way an aborted request does.
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      const err = new Error("The operation was aborted due to timeout");
      err.name = "TimeoutError";
      throw err;
    });

    const { POST } = await import("@/app/api/geo-pricing/route");
    const res = await POST(
      new Request("https://www.scoutit.space/api/geo-pricing", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.90" },
        body: JSON.stringify({ location: "BGC", category: "commercial", price: 1000 }),
      })
    );

    // The contract is "a response", not "a specific code" — what must never
    // happen is the promise never settling.
    expect(res.status).toBeGreaterThanOrEqual(400);
    const payload = await res.json();
    expect(payload.error).toBeDefined();
  });
});
