import { describe, it, expect, beforeEach } from "vitest";
import {
  SHARE_CHANNELS,
  buildShareUrl,
  cleanPropertyUrl,
  refForUserId,
  refLooksSafe,
  resolveShareRef,
} from "../shareAttribution";

// ═══════════════════════════════════════════════════════════════
// The privacy assertions here are the point of the file. The owner chose
// person-level attribution (2026-08-13), and these links get pasted into
// public Facebook posts — so "the ref never contains identifying data" has to
// be a test, not a promise in a comment.
// ═══════════════════════════════════════════════════════════════

const USER_ID = "9f2b7c14-3d5e-4a6b-8c9d-0e1f2a3b4c5d";
const BASE = "https://www.scoutit.space/property/one-ecom-center";

describe("shareAttribution — buildShareUrl", () => {
  it("adds the campaign parameters for a known channel", () => {
    const url = new URL(buildShareUrl(BASE, { channel: "viber", ref: "uabc123def456" }));
    expect(url.searchParams.get("utm_source")).toBe("viber");
    expect(url.searchParams.get("utm_medium")).toBe("share");
    expect(url.searchParams.get("utm_campaign")).toBe("property_share");
    expect(url.searchParams.get("ref")).toBe("uabc123def456");
    expect(url.pathname).toBe("/property/one-ecom-center");
  });

  it("supports every declared channel", () => {
    SHARE_CHANNELS.forEach((channel) => {
      const url = new URL(buildShareUrl(BASE, { channel }));
      expect(url.searchParams.get("utm_source")).toBe(channel);
    });
  });

  it("falls back to `copy` rather than inventing a phantom GA4 source", () => {
    const url = new URL(buildShareUrl(BASE, { channel: "tiktok-typo" }));
    expect(url.searchParams.get("utm_source")).toBe("copy");
  });

  it("replaces stale attribution instead of stacking it on a re-share", () => {
    const already = `${BASE}?utm_source=facebook&utm_medium=share&utm_campaign=property_share&ref=uold000000`;
    const url = new URL(buildShareUrl(already, { channel: "viber", ref: "unew111111" }));
    expect(url.searchParams.getAll("utm_source")).toEqual(["viber"]);
    expect(url.searchParams.getAll("ref")).toEqual(["unew111111"]);
    expect(url.toString()).not.toContain("facebook");
    expect(url.toString()).not.toContain("uold");
  });

  it("keeps unrelated query params the page may depend on", () => {
    const url = new URL(buildShareUrl(`${BASE}?unit=12b`, { channel: "x" }));
    expect(url.searchParams.get("unit")).toBe("12b");
  });

  it("omits ref entirely when there isn't a safe one", () => {
    const url = new URL(buildShareUrl(BASE, { channel: "x", ref: "" }));
    expect(url.searchParams.has("ref")).toBe(false);
  });

  it("returns the input unchanged rather than throwing on a junk URL", () => {
    expect(buildShareUrl("not a url", { channel: "x" })).toBe("not a url");
    expect(buildShareUrl("", { channel: "x" })).toBe("");
  });
});

describe("shareAttribution — ref never leaks identity", () => {
  it("rejects anything that looks like an email, uuid, or name", () => {
    [
      "jerzelguerra26@gmail.com",
      USER_ID,
      "broker-jerzel",
      "Jerzel",
      "u_ABC",
      "u-123456",
      "",
      null,
      undefined,
      12345,
    ].forEach((bad) => expect(refLooksSafe(bad)).toBe(false));
  });

  it("accepts the shapes the module actually mints", async () => {
    const ref = await refForUserId(USER_ID);
    expect(refLooksSafe(ref)).toBe(true);
    expect(ref.startsWith("u")).toBe(true);
  });

  it("does not contain the user id, or any fragment of it", async () => {
    const ref = await refForUserId(USER_ID);
    expect(ref).not.toContain(USER_ID);
    // No 4+ character run of the id survives into the code.
    const fragments = USER_ID.replace(/-/g, "").match(/.{4}/g) || [];
    fragments.forEach((fragment) => expect(ref).not.toContain(fragment));
  });

  it("is stable for the same person and different for another", async () => {
    const a1 = await refForUserId(USER_ID);
    const a2 = await refForUserId(USER_ID);
    const b = await refForUserId("11111111-2222-3333-4444-555555555555");
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });

  it("never lands an unsafe ref in a URL even if a caller passes one", () => {
    const url = new URL(buildShareUrl(BASE, { channel: "facebook", ref: "jerzel@example.com" }));
    expect(url.searchParams.has("ref")).toBe(false);
    expect(url.toString()).not.toContain("jerzel");
  });

  it("returns an empty code for a missing user id rather than a fake one", async () => {
    expect(await refForUserId("")).toBe("");
    expect(await refForUserId(null)).toBe("");
  });
});

describe("shareAttribution — anonymous visitors", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("mints a safe visitor code and reuses it", async () => {
    const first = await resolveShareRef(null);
    expect(refLooksSafe(first)).toBe(true);
    expect(first.startsWith("v")).toBe(true);
    expect(await resolveShareRef(null)).toBe(first);
  });

  it("prefers the signed-in code when a user id is available", async () => {
    const ref = await resolveShareRef(USER_ID);
    expect(ref.startsWith("u")).toBe(true);
  });
});

describe("shareAttribution — cleanPropertyUrl", () => {
  it("strips query and hash back to the canonical page URL", () => {
    expect(cleanPropertyUrl(`${BASE}?utm_source=viber&ref=uabc#gallery`)).toBe(BASE);
  });

  it("passes junk through rather than throwing", () => {
    expect(cleanPropertyUrl("nonsense")).toBe("nonsense");
    expect(cleanPropertyUrl(null)).toBe("");
  });
});
