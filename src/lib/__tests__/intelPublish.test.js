import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { buildIntelFields, pushBriefingToAirtable, publishedMarkers } from "@/lib/intelPublish";

// ─────────────────────────────────────────────────────────────────────────
// The defect this bridge replaces was not a crash. `published_to_airtable`
// was hardcoded true on insert while nothing ever wrote to Airtable — a column
// certifying something that never happened. So the tests that matter most are
// the ones proving we do NOT mark a briefing published unless a record id came
// back.
// ─────────────────────────────────────────────────────────────────────────

const briefing = (over = {}) => ({
  slug: "bgc-office-supply",
  title: "BGC Office Supply Tightens",
  excerpt: "Vacancy fell for the third straight quarter.",
  lead: "A lead paragraph.",
  body_json: [{ type: "paragraph", text: "Body." }],
  city: "BGC, Taguig",
  category: "MARKET INTEL",
  published_at: "2026-08-20T04:00:00.000Z",
  ...over,
});

const okResponse = (payload) => ({
  ok: true,
  json: async () => payload,
  text: async () => JSON.stringify(payload),
});

describe("buildIntelFields", () => {
  it("writes Slug, because INTEL_CMS.Slug is a text field not a formula", () => {
    // AGENTS.md forbids writing Slug — that rule is about PROPERTIES_CMS,
    // where it is a formula. Getting this backwards publishes an article with
    // no URL.
    const f = buildIntelFields(briefing());
    expect(f.Slug).toBe("bgc-office-supply");
  });

  it("serialises jsonb body blocks to a JSON string for Airtable", () => {
    const f = buildIntelFields(briefing());
    expect(typeof f.Body_JSON).toBe("string");
    expect(JSON.parse(f.Body_JSON)).toEqual([{ type: "paragraph", text: "Body." }]);
  });

  it("passes an already-stringified body through unchanged", () => {
    const f = buildIntelFields(briefing({ body_json: '[{"type":"divider"}]' }));
    expect(f.Body_JSON).toBe('[{"type":"divider"}]');
  });

  it("never auto-approves for the live site", () => {
    // Reaching Airtable is not the same as passing human review. If this ever
    // becomes true, the bridge publishes straight past an editor.
    const f = buildIntelFields(briefing());
    expect(f.Approved_For_Live_Site).toBe(false);
  });

  it("carries source provenance into the draft notes", () => {
    const f = buildIntelFields(briefing({ source_name: "PSA", source_url: "https://psa.gov.ph/x" }));
    expect(f.AI_Draft_Notes).toContain("PSA");
    expect(f.AI_Draft_Notes).toContain("https://psa.gov.ph/x");
  });

  it("includes the experience reference, not the experience itself", () => {
    const f = buildIntelFields(briefing({
      experience_id: "flood-scrolly-v1",
      experience_config: { zoom: 13 },
    }));
    expect(f.Experience_ID).toBe("flood-scrolly-v1");
    expect(JSON.parse(f.Experience_Config)).toEqual({ zoom: 13 });
  });

  it("omits the experience fields entirely when there is no interactive", () => {
    const f = buildIntelFields(briefing());
    expect(f).not.toHaveProperty("Experience_ID");
    expect(f).not.toHaveProperty("Experience_Config");
  });

  it("omits Related_Property rather than sending an empty array", () => {
    expect(buildIntelFields(briefing(), [])).not.toHaveProperty("Related_Property");
    expect(buildIntelFields(briefing(), ["recABC"]).Related_Property).toEqual(["recABC"]);
  });

  it("refuses a briefing with no slug or title", () => {
    expect(() => buildIntelFields(briefing({ slug: "" }))).toThrow();
    expect(() => buildIntelFields(briefing({ title: "" }))).toThrow();
    expect(() => buildIntelFields(null)).toThrow();
  });
});

describe("pushBriefingToAirtable", () => {
  it("POSTs a new article and returns the created record id", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ records: [{ id: "recNEW123456789" }] }));
    const out = await pushBriefingToAirtable({
      apiKey: "key", baseId: "appX", briefing: briefing(), fetchImpl,
    });
    expect(out).toEqual({ recordId: "recNEW123456789", created: true });
    expect(fetchImpl.mock.calls[0][1].method).toBe("POST");
  });

  it("PATCHes instead of duplicating when the briefing was published before", async () => {
    // Re-publishing is a normal editorial action. A bridge that creates a
    // second article every run is worse than one that fails loudly.
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ id: "recOLD123456789" }));
    const out = await pushBriefingToAirtable({
      apiKey: "key", baseId: "appX",
      briefing: briefing({ airtable_record_id: "recOLD123456789" }),
      fetchImpl,
    });
    expect(out).toEqual({ recordId: "recOLD123456789", created: false });
    expect(fetchImpl.mock.calls[0][1].method).toBe("PATCH");
    expect(fetchImpl.mock.calls[0][0]).toContain("recOLD123456789");
  });

  it("throws on an Airtable error instead of resolving quietly", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false, status: 422, text: async () => "UNKNOWN_FIELD_NAME", json: async () => ({}),
    });
    await expect(pushBriefingToAirtable({
      apiKey: "key", baseId: "appX", briefing: briefing(), fetchImpl,
    })).rejects.toThrow(/422/);
  });

  it("throws when Airtable returns 200 but no record id", async () => {
    // The silent shape of the original bug: a call that "succeeded" and wrote
    // nothing identifiable.
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ records: [] }));
    await expect(pushBriefingToAirtable({
      apiKey: "key", baseId: "appX", briefing: briefing(), fetchImpl,
    })).rejects.toThrow(/no record id/);
  });

  it("refuses to run without credentials", async () => {
    await expect(pushBriefingToAirtable({ apiKey: "", baseId: "appX", briefing: briefing() }))
      .rejects.toThrow(/credentials/);
  });
});

describe("publishedMarkers", () => {
  it("cannot mark a briefing published without a record id", () => {
    // This is the whole point. The old code set published_to_airtable: true
    // unconditionally, at insert, with no Airtable write anywhere.
    expect(() => publishedMarkers(null)).toThrow();
    expect(() => publishedMarkers("")).toThrow();
    expect(() => publishedMarkers(undefined)).toThrow();
  });

  it("records the real record id alongside the flag", () => {
    const m = publishedMarkers("recABC123456789");
    expect(m.airtable_record_id).toBe("recABC123456789");
    expect(m.published_to_airtable).toBe(true);
    expect(typeof m.published_at).toBe("string");
  });
});


// ─────────────────────────────────────────────────────────────────────────
// The bridge now HAS a caller: /api/admin/osint `publish_briefing`.
// Standing Rule 13 — an endpoint with no caller is a plan, not a feature —
// so the wiring is asserted, not assumed. Source-level, because the route is
// staff-gated and service-role backed; the behaviour it guards is covered by
// the unit tests above.
// ─────────────────────────────────────────────────────────────────────────
describe("publish_briefing wiring", () => {
  const route = readFileSync("src/app/api/admin/osint/route.js", "utf8");

  it("calls the bridge from the publish action", () => {
    expect(route).toContain("pushBriefingToAirtable");
  });

  it("writes the published markers only after a record id comes back", () => {
    // publishedMarkers throws without an id, so its presence INSIDE the try
    // that follows the push is what makes the ordering safe.
    const idx = route.indexOf("pushBriefingToAirtable");
    const markersIdx = route.indexOf("publishedMarkers(recordId)");
    expect(idx).toBeGreaterThan(-1);
    expect(markersIdx).toBeGreaterThan(idx);
  });

  it("never re-introduces the hardcoded published_to_airtable: true", () => {
    // The original defect. If this ever returns, the column lies again.
    //
    // Comments are stripped first: the route deliberately QUOTES the old bad
    // line while explaining why it is gone, and a naive match on the raw file
    // flags that explanation as the bug. Caught by this test failing on its
    // own first run — a source-text assertion has to read code, not prose.
    const code = route
      .split(String.fromCharCode(10))
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join(" ");
    expect(code).not.toMatch(/published_to_airtable:\s*true/);
    expect(code).toMatch(/published_to_airtable:\s*false/);
  });

  it("keeps the bridge non-fatal so a sync failure cannot lose the draft", () => {
    expect(route).toContain('airtableStatus = "failed"');
    expect(route).toContain("success: true");
  });

  it("reports the Airtable outcome instead of claiming success blindly", () => {
    expect(route).toContain("airtable: { status: airtableStatus");
  });
});
