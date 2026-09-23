import { describe, expect, it } from "vitest";
import { normalizePrivateReturnPath } from "@/lib/authReturnPath";

describe("private auth return paths", () => {
  it("preserves dashboard and admin deep links", () => {
    expect(normalizePrivateReturnPath("/dashboard/inbox?deal=42#reply")).toBe("/dashboard/inbox?deal=42#reply");
    expect(normalizePrivateReturnPath("/admin")).toBe("/admin");
  });

  // A-146: settings and wishlist are auth-gated app surfaces too — a deep
  // link there must survive the login stub, same-origin only, same as above.
  it("preserves settings and wishlist deep links", () => {
    expect(normalizePrivateReturnPath("/settings")).toBe("/settings");
    expect(normalizePrivateReturnPath("/wishlist")).toBe("/wishlist");
    expect(normalizePrivateReturnPath("/settings?tab=privacy")).toBe("/settings?tab=privacy");
  });

  it.each([
    "https://attacker.example/dashboard",
    "//attacker.example/dashboard",
    "/property/one-ecom-center",
    "javascript:alert(1)",
    "",
    null,
  ])("rejects an unsafe return target: %s", (candidate) => {
    expect(normalizePrivateReturnPath(candidate)).toBe("/dashboard");
  });
});
