import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const rpc = vi.fn();

vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from, rpc } }));

const { GET } = await import("@/app/api/property/[id]/brokers/route");

const call = (slug = "airtable-only-property") =>
  GET(new Request(`https://www.scoutit.space/api/property/${slug}/brokers`), {
    params: Promise.resolve({ id: slug }),
  });

describe("public property broker roster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("returns an honest unconfigured state for an Airtable-only listing", async () => {
    const response = await call();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      represented: false,
      contactable: false,
      rosterStatus: "not_configured",
      brokers: [],
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns a non-contactable state when Airtable is public before Supabase is live", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Public catalog listing",
        slug: "public-catalog-listing",
        canonical_slug: null,
        lifecycle_state: "draft",
        pipeline_status: "pending",
      },
      error: null,
    });

    const response = await call("public-catalog-listing");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      represented: false,
      contactable: false,
      rosterStatus: "not_public",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("keeps a genuine database lookup failure distinct from an empty roster", async () => {
    maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("database unavailable") });

    const response = await call();
    expect(response.status).toBe(503);
  });

  it("does not offer an invented recipient when routing is unconfigured", () => {
    const client = readFileSync(
      resolve(process.cwd(), "src/app/property/[id]/brokers/BrokersClient.js"),
      "utf8",
    );
    expect(client).toContain(") : contactable ? (");
    expect(client).toContain("No broker or recipient is being implied.");
  });
});
