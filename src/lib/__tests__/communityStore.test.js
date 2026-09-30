import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { geocodeSignalScope, mapDbSignalToCard } from "../communityStore";

const TOKEN_KEY = "MAPBOX_SERVER_TOKEN";
let savedToken;

beforeEach(() => {
  savedToken = process.env[TOKEN_KEY];
  process.env[TOKEN_KEY] = "pk.test-token";
});

afterEach(() => {
  if (savedToken === undefined) delete process.env[TOKEN_KEY];
  else process.env[TOKEN_KEY] = savedToken;
});

function fetchOk(center) {
  return async () => ({ json: async () => ({ features: [{ center }] }) });
}

describe("community geocoding at create (A-145 C1)", () => {
  it("pins district precision from a resolved scope", async () => {
    const geo = await geocodeSignalScope(
      { district: "BGC", city: "Taguig" },
      fetchOk([121.0503, 14.5409])
    );
    expect(geo).toEqual({ lng: 121.0503, lat: 14.5409 });
  });

  it("stays unpinned when Mapbox knows nothing, instead of guessing", async () => {
    const geo = await geocodeSignalScope(
      { district: "Nowhere", city: "Void" },
      fetchOk(null)
    );
    expect(geo).toBe(null);
  });

  it("stays unpinned when the call fails, instead of blocking publish", async () => {
    const geo = await geocodeSignalScope(
      { district: "Ortigas Center", city: "Pasig" },
      async () => {
        throw new Error("network down");
      }
    );
    expect(geo).toBe(null);
  });

  it("asks nothing without a scope", async () => {
    let called = false;
    const geo = await geocodeSignalScope({ district: "", city: "" }, async () => {
      called = true;
      return { json: async () => ({}) };
    });
    expect(geo).toBe(null);
    expect(called).toBe(false);
  });

  it("resolves exact coordinates from a building name via Mapbox fallback when not in DB", async () => {
    const geo = await geocodeSignalScope(
      { buildingName: "One E-Com Center", district: "Mall of Asia Complex", city: "Pasay" },
      fetchOk([120.9822, 14.5342])
    );
    expect(geo).toEqual({ lng: 120.9822, lat: 14.5342, precisionLevel: "exact" });
  });
});

describe("community author controls", () => {
  it("derives ownership from the verified account, never the public Scout ID", () => {
    const row = {
      id: "signal-1",
      author_account_id: "owner-account",
      scout_id_snapshot: "SCOUT-0042",
      public_identity_mode: "anonymous",
      signal_type: "LOOKING_FOR",
      title: "Looking for a workspace",
      body: "Near BGC",
      last_confirmed_at: "2026-09-27T00:00:00Z",
      created_at: "2026-09-27T00:00:00Z",
    };
    const now = new Date("2026-09-27T01:00:00Z");
    const own = mapDbSignalToCard(row, {}, {}, now, "owner-account");
    const other = mapDbSignalToCard(row, {}, {}, now, "other-account");
    const guest = mapDbSignalToCard(row, {}, {}, now);

    expect(own.isMine).toBe(true);
    expect(other.isMine).toBe(false);
    expect(guest.isMine).toBe(false);
    expect(own.author.scoutId).toBe("SCOUT-0042");
    expect(own).not.toHaveProperty("author_account_id");
    expect(own.author).not.toHaveProperty("accountId");
  });
});
