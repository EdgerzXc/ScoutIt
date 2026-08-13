import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent, GA_EVENTS } from "../analytics";

describe("GA4 outcome events", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete globalThis.window;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    delete globalThis.window;
  });

  it("exposes the five outcome events the audit asked for", () => {
    expect(Object.values(GA_EVENTS).sort()).toEqual([
      "board_save",
      "connect_spent",
      "inquiry_sent",
      "property_published",
      "signup_completed",
    ]);
  });

  it("no-ops when NEXT_PUBLIC_GA_ID is unset, even if gtag exists", () => {
    // This is the guard that must not be broken: with no measurement id,
    // GoogleAnalytics renders nothing and nothing may be reported anywhere.
    const gtag = vi.fn();
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "");
    globalThis.window = { gtag };
    expect(trackEvent(GA_EVENTS.BOARD_SAVE, { property_id: "p1" })).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("no-ops on the server, where there is no gtag", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    expect(trackEvent(GA_EVENTS.INQUIRY_SENT)).toBe(false);
  });

  it("sends the event when the id is set and gtag is present", () => {
    const gtag = vi.fn();
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    globalThis.window = { gtag };
    expect(trackEvent(GA_EVENTS.CONNECT_SPENT, { spend_reason: "pitch", amount: 1 })).toBe(true);
    expect(gtag).toHaveBeenCalledWith("event", "connect_spent", {
      spend_reason: "pitch",
      amount: 1,
    });
  });

  it("never throws a user action down when gtag misbehaves", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    globalThis.window = { gtag: () => { throw new Error("boom"); } };
    expect(() => trackEvent(GA_EVENTS.PROPERTY_PUBLISHED)).not.toThrow();
    expect(trackEvent(GA_EVENTS.PROPERTY_PUBLISHED)).toBe(false);
  });

  it("ignores a missing event name", () => {
    const gtag = vi.fn();
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    globalThis.window = { gtag };
    expect(trackEvent(undefined)).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});
