import { describe, expect, it } from "vitest";
import { getCoreAccountPresentation } from "@/components/descent/coreAccountPresentation";

describe("Core account presentation", () => {
  it("keeps the checking state neutral until identity is verified", () => {
    const view = getCoreAccountPresentation({ status: "checking", isAuthenticated: false });
    expect(view.title).toBe("Confirming your account…");
    expect(view.body).not.toContain("activity");
  });

  it("routes a verified account to real protected activity without invented counts", () => {
    const view = getCoreAccountPresentation({ status: "signed-in", isAuthenticated: true, name: "Mina" });
    expect(view.title).toContain("Mina");
    expect(view.href).toBe("/dashboard");
    expect(view.cta).toBe("Open live dashboard");
    expect(view.body).toContain("real saved spaces");
    expect(view.body).toContain("No counts are guessed");
  });

  it("keeps signed-out exploration useful and routes protected continuity to onboarding", () => {
    const view = getCoreAccountPresentation({ status: "signed-out", isAuthenticated: false });
    expect(view.href).toBe("/onboarding");
    expect(view.title).toContain("Explore first");
    expect(view.body).toContain("No sign-in is required");
  });
});
