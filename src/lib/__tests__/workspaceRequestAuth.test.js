import { describe, expect, it, vi } from "vitest";
import { getVerifiedWorkspaceUser } from "@/lib/workspaceRequestAuth";

const user = { id: "account", factors: [{ status: "verified" }] };

function clientFor(account = user) {
  return { auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: account }, error: null }),
    getClaims: vi.fn(),
  } };
}

describe("server workspace session assurance", () => {
  it("preserves verified identity without an enrolled factor", async () => {
    const account = { id: "account", factors: [{ status: "unverified" }] };
    const client = clientFor(account);
    await expect(getVerifiedWorkspaceUser(client, "fixture")).resolves.toEqual({ data: { user: account }, error: null });
    expect(client.auth.getClaims).not.toHaveBeenCalled();
  });

  it("requires AAL2 for an enrolled factor and verifies the same access token", async () => {
    const client = clientFor();
    client.auth.getClaims.mockResolvedValue({ data: { claims: { sub: user.id, aal: "aal1" } }, error: null });
    await expect(getVerifiedWorkspaceUser(client, "fixture")).resolves.toEqual({
      data: { user: null }, error: { code: "mfa_required", status: 403 },
    });
    expect(client.auth.getUser).toHaveBeenCalledWith("fixture");
    expect(client.auth.getClaims).toHaveBeenCalledWith("fixture");
  });

  it("accepts verified AAL2 for the same user", async () => {
    const client = clientFor();
    client.auth.getClaims.mockResolvedValue({ data: { claims: { sub: user.id, aal: "aal2" } }, error: null });
    await expect(getVerifiedWorkspaceUser(client, "fixture")).resolves.toEqual({ data: { user }, error: null });
  });

  it.each([null, { sub: "different-user", aal: "aal2" }, { sub: user.id }, { sub: user.id, aal: "unknown" }])(
    "denies missing or mismatched assurance claims %j",
    async (claims) => {
      const client = clientFor();
      client.auth.getClaims.mockResolvedValue({ data: { claims }, error: null });
      await expect(getVerifiedWorkspaceUser(client, "fixture")).resolves.toEqual({
        data: { user: null }, error: { code: "invalid_session_assurance", status: 401 },
      });
    },
  );

  it("preserves token rejection and fails closed during an assurance lookup outage", async () => {
    const client = clientFor();
    const invalid = { data: { user: null }, error: { status: 401 } };
    client.auth.getUser.mockResolvedValueOnce(invalid);
    await expect(getVerifiedWorkspaceUser(client, "fixture")).resolves.toBe(invalid);
    expect(client.auth.getClaims).not.toHaveBeenCalled();

    client.auth.getClaims.mockRejectedValue(new Error("provider unavailable"));
    await expect(getVerifiedWorkspaceUser(client, "fixture")).resolves.toEqual({
      data: { user: null }, error: { code: "session_assurance_unavailable", status: 503 },
    });
  });
});
