import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/generate-seo/route";

const source = vi.hoisted(() => ({
  listing: null,
  catalogue: vi.fn(),
  purge: vi.fn(),
  update: vi.fn(),
  generate: vi.fn(),
}));

vi.mock("@/lib/adminGuard", () => ({ requireAdmin: async () => ({ userId: "staff-1" }) }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: source.listing }) }) }) }) },
}));
vi.mock("@/lib/airtable", () => ({ updateProperty: source.update }));
vi.mock("@/lib/cmsCache", () => ({ getCmsBundle: source.catalogue, invalidateCmsBundle: source.purge }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class Anthropic {
    messages = { create: source.generate };
  },
}));

function generate() {
  return POST(new Request("https://scoutit.space/api/admin/generate-seo", {
    method: "POST",
    body: JSON.stringify({ id: "recBound" }),
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AIRTABLE_API_KEY", "fixture");
  vi.stubEnv("AIRTABLE_BASE_ID", "fixture");
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  source.listing = { canonical_slug: "tower-one", publication_external_record_id: "recBound", pipeline_status: "approved" };
  source.catalogue.mockResolvedValue({
    properties: [{ id: "recBound", slug: "tower-one", title: "Tower One", location: "Taguig", spaceCategory: "Commercial" }],
  });
  source.update.mockResolvedValue({ id: "recBound", fields: { Slug: "tower-one" } });
  source.purge.mockResolvedValue({ sharedCachePurged: true });
});
afterEach(() => vi.unstubAllEnvs());

describe("staff metadata publication", () => {
  it("publishes metadata and structured data only to the verified canonical record", async () => {
    const response = await generate();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, generatedBy: "listing_facts" });
    expect(source.update).toHaveBeenCalledExactlyOnceWith("fixture", "fixture", "tower-one",
      expect.objectContaining({ expectedRecordId: "recBound", seo_title: "Tower One | ScoutIt" }));
    const jsonLd = JSON.parse(source.update.mock.calls[0][3].seo_json_ld);
    expect(jsonLd["@graph"][0].url).toContain("/property/tower-one");
  });

  it("does not generate or publish for an unbound or differently mapped record", async () => {
    source.listing = null;
    expect((await generate()).status).toBe(409);
    expect(source.catalogue).not.toHaveBeenCalled();
    source.listing = { canonical_slug: "tower-one", publication_external_record_id: "recBound", pipeline_status: "approved" };
    source.catalogue.mockResolvedValue({ properties: [{ id: "recOther", slug: "tower-one" }] });
    expect((await generate()).status).toBe(409);
    expect(source.generate).not.toHaveBeenCalled();
    expect(source.update).not.toHaveBeenCalled();
  });

  it("uses listing facts if the optional text generator returns invalid output", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "fixture");
    source.generate.mockResolvedValue({ content: [{ type: "text", text: '{"title":"only a title"}' }] });
    const response = await generate();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ generatedBy: "listing_facts" });
    expect(source.update).toHaveBeenCalledTimes(1);
  });
});
