import { describe, it, expect, vi, afterEach } from "vitest";
import { motionSafeScrollBehavior, prefersReducedMotion } from "../scrollBehavior";

// A-146: six call sites animated smooth unconditionally. The helper is the
// contract — instant for reduced-motion, smooth otherwise, smooth when the
// environment cannot answer (SSR, old browsers).

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("motion-safe scroll behavior", () => {
  it("returns auto when the OS asks for reduced motion", () => {
    vi.stubGlobal("window", {
      matchMedia: (query) => ({ matches: query === "(prefers-reduced-motion: reduce)" }),
    });
    expect(prefersReducedMotion()).toBe(true);
    expect(motionSafeScrollBehavior()).toBe("auto");
  });

  it("returns smooth otherwise", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    expect(prefersReducedMotion()).toBe(false);
    expect(motionSafeScrollBehavior()).toBe("smooth");
  });

  it("returns smooth when the environment cannot answer", () => {
    vi.stubGlobal("window", {});
    expect(motionSafeScrollBehavior()).toBe("smooth");
  });

  it("returns auto under Lite Mode even without the OS switch", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    document.documentElement.classList.add("lite-mode");
    try {
      expect(motionSafeScrollBehavior()).toBe("auto");
    } finally {
      document.documentElement.classList.remove("lite-mode");
    }
  });
});
