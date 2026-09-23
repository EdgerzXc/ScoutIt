import { describe, it, expect, vi, beforeEach } from "vitest";

// A-147 (owner spec S1): an unrepresented property's Your Move states the
// uploader as "Anonymous" unless the owner published themselves — resolved
// server-side, never guessed in the browser. These pin the roster route's
// `uploader` field across its branches.

const state = vi.hoisted(() => ({
  property: {
    id: "prop-1",
    title: "Tower One",
    owner_id: "owner-1",
    slug: "tower-one",
    canonical_slug: "tower-one",
    lifecycle_state: "live",
    pipeline_status: "approved",
  },
  ownerProfile: { id: "owner-1", display_name: "Leroy", is_profile_public: false },
  brokerProfiles: [],
  brokerMetrics: [],
  routing: { ok: true, roster: [], recipients: [{ recipientId: "owner-1" }] },
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === "properties") return { data: { ...state.property }, error: null };
            return { data: state.ownerProfile ? { ...state.ownerProfile } : null, error: null };
          },
        }),
        in: async () => {
          if (table === "user_profiles") return { data: [...state.brokerProfiles], error: null };
          return { data: [...state.brokerMetrics], error: null };
        },
      }),
    }),
  },
}));

vi.mock("@/lib/serverBrokerRouting", () => ({
  getPropertyLeadRecipients: async () => state.routing,
}));

const { GET } = await import("@/app/api/property/[id]/brokers/route");

const call = () =>
  GET(new Request("https://www.scoutit.space/api/property/tower-one/brokers"), {
    params: Promise.resolve({ id: "tower-one" }),
  }).then(async (res) => ({ status: res.status, body: await res.json() }));

beforeEach(() => {
  state.property = {
    id: "prop-1",
    title: "Tower One",
    owner_id: "owner-1",
    slug: "tower-one",
    canonical_slug: "tower-one",
    lifecycle_state: "live",
    pipeline_status: "approved",
  };
  state.ownerProfile = { id: "owner-1", display_name: "Leroy", is_profile_public: false };
  state.brokerProfiles = [];
  state.brokerMetrics = [];
  state.routing = { ok: true, roster: [], recipients: [{ recipientId: "owner-1" }] };
});

describe("A-147 — roster uploader disclosure", () => {
  it("states Anonymous for a private owner", async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.rosterStatus).toBe("unrepresented");
    expect(body.uploader).toBe("Anonymous");
  });

  it("names a public owner", async () => {
    state.ownerProfile = { id: "owner-1", display_name: "Leroy", is_profile_public: true };
    const { body } = await call();
    expect(body.uploader).toBe("Leroy");
  });

  it("falls back to Anonymous when the public owner has no name on file", async () => {
    state.ownerProfile = { id: "owner-1", display_name: "   ", is_profile_public: true };
    const { body } = await call();
    expect(body.uploader).toBe("Anonymous");
  });

  it("returns null when the owner row is missing, never a user id", async () => {
    state.ownerProfile = null;
    const { body } = await call();
    expect(body.uploader).toBeNull();
    expect(JSON.stringify(body)).not.toContain("owner-1");
  });

  it("omits the uploader entirely once representation exists", async () => {
    state.routing = {
      ok: true,
      roster: [{ recipientId: "broker-1", representationId: "rep-1" }],
      recipients: [{ recipientId: "broker-1" }],
    };
    state.brokerProfiles = [
      { id: "broker-1", display_name: "Ramon Cruz", avatar_url: "", headline: "", bio: "", firm: "", prc_license: "", is_profile_public: true },
    ];
    const { body } = await call();
    expect(body.represented).toBe(true);
    expect(body.brokers).toHaveLength(1);
    expect(body).not.toHaveProperty("uploader");
  });

  it("omits the uploader for non-live properties", async () => {
    state.property = { ...state.property, pipeline_status: "off_market", lifecycle_state: "off_market" };
    const { body } = await call();
    expect(body.rosterStatus).toBe("not_public");
    expect(body).not.toHaveProperty("uploader");
  });
});
