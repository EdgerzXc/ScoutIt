import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// U-020 — /api/intel/ingest authenticated any valid session, then called a paid
// Gemini model on a document of up to 20 MB, and only required staff much later
// for *publish*. Any registered account could sign up, upload a 20 MB PDF and
// repeat, billing the owner's single shared GEMINI_API_KEY. The route was also
// absent from isSensitivePath in src/proxy.js, so it got the loosest limiter and
// FAILED OPEN when Upstash was unavailable.
//
// These assertions are behavioural on purpose: the route handler is actually
// invoked, and the guard is proven by observing that the Gemini client is never
// constructed — not by grepping the source for a line.

const geminiConstructions = [];
const generateContent = vi.fn(async () => ({ text: "{}" }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor(options) {
      geminiConstructions.push(options);
      this.models = { generateContent };
    }
  },
  Type: new Proxy({}, { get: (_target, key) => String(key) }),
}));

const currentUser = { value: { id: "user-non-staff" } };
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: currentUser.value }, error: null }) },
  }),
}));

const adminVerdict = { value: { error: "Unauthorized: Admin privileges required", status: 403 } };
vi.mock("@/lib/adminGuard", () => ({
  requireAdmin: async () => adminVerdict.value,
}));

const { isSensitivePath, rateLimitTier } = await import("@/lib/sensitiveRoutes");
const ingest = await import("@/app/api/intel/ingest/route");

function ingestRequest(fields = {}) {
  const body = new FormData();
  body.set("text", "Makati office vacancy fell to 14 percent in the second quarter.");
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return new Request("https://www.scoutit.space/api/intel/ingest", {
    method: "POST",
    headers: { Authorization: "Bearer session-token" },
    body,
  });
}

describe("U-020 · the paid model call sits behind the staff gate", () => {
  beforeEach(() => {
    geminiConstructions.length = 0;
    generateContent.mockClear();
    process.env.GEMINI_API_KEY = "test-key";
    adminVerdict.value = { error: "Unauthorized: Admin privileges required", status: 403 };
    currentUser.value = { id: "user-non-staff" };
  });

  afterEach(() => vi.restoreAllMocks());

  it("refuses a signed-in non-staff caller before any model is constructed", async () => {
    const response = await ingest.POST(ingestRequest());

    expect(response.status).toBe(403);
    expect(geminiConstructions).toHaveLength(0);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("says plainly that ingest is staff-only, rather than failing later at publish", async () => {
    const response = await ingest.POST(ingestRequest());
    const payload = await response.json();

    expect(String(payload.error)).toMatch(/staff/i);
    expect(String(payload.error)).toMatch(/ingest|Intel/i);
  });

  it("still refuses a caller with no session at all, with 401", async () => {
    currentUser.value = null;
    const response = await ingest.POST(ingestRequest());

    expect(response.status).toBe(401);
    expect(geminiConstructions).toHaveLength(0);
  });

  it("lets a staff caller through to the model and the deterministic fallback alike", async () => {
    adminVerdict.value = { user: { id: "staff-1" }, userId: "staff-1" };

    const preview = await ingest.POST(ingestRequest({ previewOnly: "true" }));
    expect(preview.status).toBe(200);
    expect(geminiConstructions).toHaveLength(1);

    delete process.env.GEMINI_API_KEY;
    geminiConstructions.length = 0;
    const fallback = await ingest.POST(ingestRequest({ previewOnly: "true" }));
    const payload = await fallback.json();

    expect(fallback.status).toBe(200);
    expect(payload.engine).toBe("fallback");
    expect(geminiConstructions).toHaveLength(0);
  });
});

describe("U-020 · /api/intel/ is metered like the other paid routes", () => {
  it("treats every /api/intel/ path as sensitive, so the limiter fails closed", () => {
    expect(isSensitivePath("/api/intel/ingest")).toBe(true);
    expect(isSensitivePath("/api/intel/")).toBe(true);
  });

  it("keeps the routes that were already sensitive sensitive", () => {
    expect(isSensitivePath("/api/auth/callback")).toBe(true);
    expect(isSensitivePath("/api/ai/promote")).toBe(true);
    expect(isSensitivePath("/api/storage/upload")).toBe(true);
  });

  it("does not capture an unrelated or near-prefix route", () => {
    expect(isSensitivePath("/api/cms")).toBe(false);
    expect(isSensitivePath("/api/intel-other")).toBe(false);
    expect(isSensitivePath("/api/geo-pricing")).toBe(false);
  });

  it("meters /api/intel/ with the AI tier, not the standard tier", () => {
    expect(rateLimitTier("/api/intel/ingest")).toBe("ai");
    expect(rateLimitTier("/api/ai/promote")).toBe("ai");
    expect(rateLimitTier("/api/auth/callback")).toBe("strict");
    expect(rateLimitTier("/api/cms")).toBe("standard");
  });
});
