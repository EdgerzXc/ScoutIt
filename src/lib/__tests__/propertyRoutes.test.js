import { describe, expect, it } from "vitest";

import { unitDetailPath } from "../propertyRoutes";

describe("property route construction", () => {
  it("builds the canonical unit path for safe slugs", () => {
    expect(unitDetailPath("capitol-commons", "unit-12a")).toBe(
      "/property/capitol-commons/unit/unit-12a"
    );
  });

  it("keeps untrusted IDs inside their path segments", () => {
    const path = unitDetailPath("../admin?mode=1", "x#fragment/javascript:alert(1)");

    expect(path).toBe(
      "/property/..%2Fadmin%3Fmode%3D1/unit/x%23fragment%2Fjavascript%3Aalert(1)"
    );
    expect(path.startsWith("/property/")).toBe(true);
  });
});
