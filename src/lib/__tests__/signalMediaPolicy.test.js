import { afterEach, describe, expect, it, vi } from "vitest";
import { signalMediaSlots, signalMediaSlotAllowed } from "../signalMediaPolicy";
import { signalMediaPilotTier, withApprovedSignalMedia } from "../signalMediaServer";
import { stratosphereFeedHref } from "../stratosphereFeed";

const account = "bb1016c9-f266-42d6-9434-73adadfbac94";
afterEach(() => vi.unstubAllEnvs());

describe("signal media contract", () => {
  it("limits media independently of text posting and limits video to eligible promotions", () => {
    const promo = "COMMERCIAL_PROMOTION";
    expect(signalMediaSlots("starry", promo, true)).toEqual({ photoLimit: 0, videoLimit: 0 });
    expect(signalMediaSlots("solar", promo, true)).toEqual({ photoLimit: 3, videoLimit: 0 });
    expect(signalMediaSlots("cluster", promo, true)).toEqual({ photoLimit: 3, videoLimit: 1 });
    expect(signalMediaSlots("universe", "LOOKING_FOR", true)).toEqual({ photoLimit: 3, videoLimit: 0 });
    expect(signalMediaSlots("universe", promo, false).videoLimit).toBe(0);
    expect(signalMediaSlotAllowed({ kind: "photo", position: 3, photoLimit: 3, videoLimit: 1 })).toBe(false);
    expect(signalMediaSlotAllowed({ kind: "video", position: 3, photoLimit: 3, videoLimit: 1 })).toBe(true);
  });

  it("requires an explicit server pilot grant and feature enablement", () => {
    vi.stubEnv("SCOUTIT_SIGNAL_MEDIA_PILOT_GRANTS", JSON.stringify({ [account]: "solar" }));
    vi.stubEnv("SCOUTIT_SIGNAL_MEDIA_ENABLED", "false");
    expect(signalMediaPilotTier(account)).toBeNull();
    vi.stubEnv("SCOUTIT_SIGNAL_MEDIA_ENABLED", "true");
    expect(signalMediaPilotTier(account)).toBe("solar");
    expect(signalMediaPilotTier("other")).toBeNull();
  });

  it("returns only public attachment metadata from the approved media query", async () => {
    vi.stubEnv("SCOUTIT_SIGNAL_MEDIA_ENABLED", "true");
    const order = vi.fn().mockResolvedValue({ data: [{ id: "asset", signal_id: "signal", kind: "photo", alt_text: "West entrance", locator: "private.webp" }] });
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order };
    const client = { from: vi.fn(() => query) };
    expect(await withApprovedSignalMedia(client, [{ id: "signal" }, { id: "other" }])).toEqual([
      { id: "signal", media: [{ id: "asset", kind: "photo", alt: "West entrance" }] },
      { id: "other" },
    ]);
    expect(query.eq).toHaveBeenCalledWith("state", "approved");
  });
});

it("carries the selected signal and filters between Radar and both feed scopes", () => {
  const params = new URLSearchParams("mode=list&place=BGC&role=owner&signalQ=office&signal=one&view=articles");
  const community = new URL(stratosphereFeedHref(params, "community"), "https://example.test");
  expect(community.pathname).toBe("/stratosphere/signals");
  expect(Object.fromEntries(community.searchParams)).toEqual({ place: "BGC", role: "owner", signalQ: "office", signal: "one", source: "community" });
  const map = new URL(stratosphereFeedHref(community.searchParams, "map"), "https://example.test");
  expect(map.pathname).toBe("/stratosphere");
  expect(map.searchParams.get("mode")).toBe("map");
  expect(map.searchParams.get("role")).toBe("owner");
});
