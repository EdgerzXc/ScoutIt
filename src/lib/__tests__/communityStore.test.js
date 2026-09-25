import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { geocodeSignalScope } from "../communityStore";

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
});
