import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, POST } from "@/app/api/wishlist/share/route";
import { decodeWishlistShareToken } from "@/lib/wishlistCrypto";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

const USER_ID = "9f1c2b7e-0000-4aaa-8bbb-1234567890ab";

function request(method) {
  return new Request("https://www.scoutit.space/api/wishlist/share", { method });
}

describe("wishlist share-link API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(USER_ID);
  });

  it.each(["POST", "DELETE"])("rejects unauthenticated %s requests", async (method) => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(null);
    const response = method === "POST" ? await POST(request(method)) : await DELETE(request(method));
    expect(response.status).toBe(401);
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("mints a token newer than the owner's revocation watermark", async () => {
    const revokedBefore = new Date(Date.now() - 1000).toISOString();
    supabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { revoked_before: revokedBefore }, error: null }),
        }),
      }),
    });

    const response = await POST(request("POST"));
    const body = await response.json();
    const details = decodeWishlistShareToken(body.shareToken);

    expect(response.status).toBe(200);
    expect(details.userId).toBe(USER_ID);
    expect(details.issuedAt).toBeGreaterThan(Date.parse(revokedBefore));
  });

  it("fails closed when revocation state cannot be checked", async () => {
    supabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error("schema unavailable") }),
        }),
      }),
    });

    expect((await POST(request("POST"))).status).toBe(503);
  });

  it("records a per-user high-watermark without storing the bearer token", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    supabaseAdmin.from.mockReturnValue({ upsert });

    const response = await DELETE(request("DELETE"));
    const payload = upsert.mock.calls[0][0];

    expect(response.status).toBe(200);
    expect(supabaseAdmin.from).toHaveBeenCalledWith("wishlist_share_revocations");
    expect(payload.user_id).toBe(USER_ID);
    expect(payload.revoked_before).toBeTruthy();
    expect(JSON.stringify(payload)).not.toContain("shareToken");
  });
});
