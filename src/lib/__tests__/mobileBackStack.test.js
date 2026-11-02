import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerMobileBackAction,
  triggerMobileBack,
  getMobileBackStackDepth,
  resetMobileBackStack,
} from "../mobileBackStack";

describe("mobileBackStack — Mobile Hardware Back Coordinator", () => {
  beforeEach(() => {
    resetMobileBackStack();
    vi.restoreAllMocks();
  });

  it("registers back actions and updates stack depth", () => {
    expect(getMobileBackStackDepth()).toBe(0);

    const onBack = vi.fn();
    const cleanup = registerMobileBackAction(onBack, { action: "preview" });

    expect(getMobileBackStackDepth()).toBe(1);

    cleanup();
    expect(getMobileBackStackDepth()).toBe(0);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("executes the latest onBack handler in LIFO order upon popstate", () => {
    const onBackStep1 = vi.fn();
    const onBackStep2 = vi.fn();

    registerMobileBackAction(onBackStep1, { action: "step1" });
    registerMobileBackAction(onBackStep2, { action: "step2" });

    expect(getMobileBackStackDepth()).toBe(2);

    // Simulate mobile hardware back button (popstate event)
    window.dispatchEvent(new Event("popstate"));

    expect(onBackStep2).toHaveBeenCalledTimes(1);
    expect(onBackStep1).not.toHaveBeenCalled();
    expect(getMobileBackStackDepth()).toBe(1);

    // Second back press
    window.dispatchEvent(new Event("popstate"));
    expect(onBackStep1).toHaveBeenCalledTimes(1);
    expect(getMobileBackStackDepth()).toBe(0);
  });

  it("handles triggerMobileBack using history.back() when actions are queued", () => {
    const historyBackSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});

    expect(triggerMobileBack()).toBe(false);
    expect(historyBackSpy).not.toHaveBeenCalled();

    registerMobileBackAction(() => {}, { action: "drawer" });

    expect(triggerMobileBack()).toBe(true);
    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });
});
