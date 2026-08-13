import { afterEach, describe, expect, it } from "vitest";
import { resolveUserId } from "@/lib/serverAuth";

describe("server mock mutation isolation", () => {
  afterEach(() => delete process.env.SCOUTIT_E2E);

  it("permits an explicitly flagged localhost mock for a read-only request", async () => {
    process.env.SCOUTIT_E2E = "1";
    const request = new Request("http://localhost:3000/api/deals", {
      headers: { "x-mock-user-id": "master-dev-e2e-reader" },
    });
    await expect(resolveUserId(request)).resolves.toBe("master-dev-e2e-reader");
  });

  it.each(["POST", "PATCH", "DELETE"])(
    "rejects a localhost mock for %s mutations",
    async (method) => {
      process.env.SCOUTIT_E2E = "1";
      const request = new Request("http://localhost:3000/api/deals", {
        method,
        headers: { "x-mock-user-id": "master-dev-e2e-writer" },
      });
      await expect(resolveUserId(request)).resolves.toBeNull();
    },
  );

  it("rejects a normal development mock unless the process is explicitly E2E", async () => {
    const request = new Request("http://localhost:3000/api/deals", {
      headers: { "x-mock-user-id": "master-dev" },
    });
    await expect(resolveUserId(request)).resolves.toBeNull();
  });
});
