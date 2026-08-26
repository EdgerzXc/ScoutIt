import { describe, expect, it } from "vitest";
import { normalizePrivateReturnPath } from "@/lib/authReturnPath";

describe("private auth return paths", () => {
  it("preserves dashboard and admin deep links", () => {
    expect(normalizePrivateReturnPath("/dashboard/inbox?deal=42#reply")).toBe("/dashboard/inbox?deal=42#reply");
    expect(normalizePrivateReturnPath("/admin")).toBe("/admin");
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
