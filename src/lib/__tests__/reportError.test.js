import { beforeEach, describe, expect, it, vi } from "vitest";

const scope = {
  setTag: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
};

const sentry = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  flush: vi.fn(),
  getClient: vi.fn(),
  withScope: vi.fn(),
}));

const auth = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@sentry/nextjs", () => sentry);
vi.mock("@/lib/supabaseClient", () => ({ supabase: { auth } }));

const { reportError } = await import("@/lib/reportError");

describe("reportError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentry.getClient.mockReturnValue({ getOptions: () => ({ dsn: "https://public@sentry.invalid/1" }) });
    sentry.withScope.mockImplementation((callback) => callback(scope));
    sentry.flush.mockResolvedValue(true);
    auth.getUser.mockResolvedValue({ data: { user: { id: "verified-user-id" } }, error: null });
  });

  it("fails honestly when monitoring is not configured", async () => {
    sentry.getClient.mockReturnValue(null);

    await expect(reportError({ kind: "user_report", message: "Broken filter" })).resolves.toBe(false);
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("attributes a user report to the verified opaque account id", async () => {
    await expect(reportError({ kind: "user_report", message: "  Broken filter  " })).resolves.toBe(true);

    expect(auth.getUser).toHaveBeenCalledOnce();
    expect(scope.setUser).toHaveBeenCalledWith({ id: "verified-user-id" });
    expect(sentry.captureMessage).toHaveBeenCalledWith("Broken filter", "info");
    expect(sentry.flush).toHaveBeenCalledWith(2000);
  });

  it("does not claim delivery when Sentry fails to flush", async () => {
    sentry.flush.mockResolvedValue(false);

    await expect(reportError({ kind: "crash", message: "Render failed" })).resolves.toBe(false);
    expect(sentry.captureException).toHaveBeenCalledOnce();
  });

  it("tags flow node metadata when an explicit nodeId is provided", async () => {
    await expect(reportError({ kind: "crash", message: "Deal room socket disconnected", nodeId: "deal_room" })).resolves.toBe(true);

    expect(scope.setTag).toHaveBeenCalledWith("scoutit.flow_node_id", "deal_room");
    expect(scope.setTag).toHaveBeenCalledWith("scoutit.flow_domain", "deal");
    expect(scope.setContext).toHaveBeenCalledWith(
      "scoutit_flow",
      expect.objectContaining({
        node_id: "deal_room",
        domain: "deal",
      })
    );
  });

  it("dispatches scoutit:flow-error window event with topological metadata", async () => {
    let capturedEvent = null;
    const listener = (e) => {
      capturedEvent = e.detail;
    };
    window.addEventListener("scoutit:flow-error", listener);

    try {
      await reportError({
        kind: "crash",
        message: "Publishing bridge timeout",
        nodeId: "api_publish_listing",
      });

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent.nodeId).toBe("api_publish_listing");
      expect(capturedEvent.message).toBe("Publishing bridge timeout");
      expect(capturedEvent.severity).toBe("CRITICAL");
    } finally {
      window.removeEventListener("scoutit:flow-error", listener);
    }
  });
});
