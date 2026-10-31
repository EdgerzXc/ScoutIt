import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SAVED_SIGNALS_STORAGE_KEY,
  getLocalSavedSignals,
  isSignalSavedLocally,
  saveSignalLocally,
  removeSignalLocally,
  syncOfflineSignalsToAccount,
} from "../savedSignalsClient";

describe("savedSignalsClient unit tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("retrieves an empty array when no signals are saved locally", () => {
    expect(getLocalSavedSignals()).toEqual([]);
    expect(isSignalSavedLocally("sig-123")).toBe(false);
  });

  it("saves a signal snapshot locally and emits scoutit:signal-saved-changed", () => {
    const eventSpy = vi.fn();
    window.addEventListener("scoutit:signal-saved-changed", eventSpy);

    const testSignal = {
      id: "sig-test-1",
      title: "PEZA Certified Floor in BGC",
      signal_type: "looking_for",
      category: "commercial",
      city: "Taguig",
      district: "BGC",
      radiusKm: 3.5,
      requirements: { area: "1200", budget: "₱1,200/sqm" },
      behavioralBadge: "[Verified Resident · 88 Index]",
      behavioralScore: 88,
    };

    const result = saveSignalLocally(testSignal);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("sig-test-1");
    expect(result[0].radiusKm).toBe(3.5);
    expect(isSignalSavedLocally("sig-test-1")).toBe(true);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0].detail).toMatchObject({
      signalId: "sig-test-1",
      isSaved: true,
      offline: true,
    });
  });

  it("removes a signal locally and emits scoutit:signal-saved-changed with isSaved: false", () => {
    saveSignalLocally({ id: "sig-remove-me", title: "Target to remove" });
    expect(isSignalSavedLocally("sig-remove-me")).toBe(true);

    const eventSpy = vi.fn();
    window.addEventListener("scoutit:signal-saved-changed", eventSpy);

    const afterRemoval = removeSignalLocally("sig-remove-me");
    expect(afterRemoval.length).toBe(0);
    expect(isSignalSavedLocally("sig-remove-me")).toBe(false);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0].detail).toMatchObject({
      signalId: "sig-remove-me",
      isSaved: false,
      offline: true,
    });
  });

  it("syncs offline signals to account when an auth token is provided", async () => {
    saveSignalLocally({ id: "sig-cloud-1", title: "Signal 1" });
    saveSignalLocally({ id: "sig-cloud-2", title: "Signal 2" });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, saved: true }),
    });

    const syncResult = await syncOfflineSignalsToAccount("fake-jwt-token");
    expect(syncResult.syncedCount).toBe(2);
    expect(syncResult.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
