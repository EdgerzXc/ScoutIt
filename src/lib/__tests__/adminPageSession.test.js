import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminEntryFor, adminReturnPath } from "../adminEntryPath";
import { adminPageCookieOptions, readAdminPageSession, sealAdminPageSession } from "../adminPageSession.server";

const { staff, cookie, redirect, readBearer, documentHeaders } = vi.hoisted(() => ({
  staff: vi.fn(), cookie: vi.fn(), redirect: vi.fn(), readBearer: vi.fn(), documentHeaders: vi.fn(),
}));
vi.mock("@/lib/adminGuard", () => ({ requireAdmin: staff, readAdminBearer: readBearer }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookie }), headers: documentHeaders }));
vi.mock("next/navigation", () => ({ redirect }));

const { GET, POST, DELETE } = await import("@/app/api/admin/session/route");
const { requireAdminPage } = await import("../requireAdminPage.server");

const origin = "https://scoutit.space";
const bearer = "fixture.jwt.value";
const secret = Buffer.alloc(32, 5).toString("base64url");
const request = (method, source = origin) =>
  new Request(origin + "/api/admin/session", {
    method, headers: { Authorization: "Bearer " + bearer, ...(source === null ? {} : { Origin: source }) },
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SCOUTIT_ADMIN_SESSION_KEY", secret);
  readBearer.mockReturnValue(bearer);
  documentHeaders.mockResolvedValue(new Headers());
  redirect.mockImplementation((target) => { throw new Error(target); });
});
afterEach(() => vi.unstubAllEnvs());

describe("staff document session seal", () => {
  it("uses unique ciphertext and enforces its server-side expiry", () => {
    const first = sealAdminPageSession(bearer, 1000);
    const second = sealAdminPageSession(bearer, 1000);
    expect(first).not.toBe(second);
    expect(first).not.toContain(bearer);
    expect(readAdminPageSession(first, 300_999)).toBe(bearer);
    expect(readAdminPageSession(first, 301_000)).toBeNull();
  });

  it("rejects a tampered cookie, a prior key and invalid lengths", () => {
    const valid = sealAdminPageSession(bearer);
    const altered = (valid[0] === "a" ? "b" : "a") + valid.slice(1);
    expect(readAdminPageSession(altered)).toBeNull();
    expect(readAdminPageSession("z".repeat(3801))).toBeNull();
    expect(sealAdminPageSession("z".repeat(2701))).toBeNull();
    vi.stubEnv("SCOUTIT_ADMIN_SESSION_KEY", Buffer.alloc(32, 6).toString("base64url"));
    expect(readAdminPageSession(valid)).toBeNull();
    vi.stubEnv("SCOUTIT_ADMIN_SESSION_KEY", "missing-or-incorrect-secret");
    expect(sealAdminPageSession(bearer)).toBeNull();
  });
});

describe("staff session endpoint", () => {
  it.each([null, "null", "http://scoutit.space", "https://other.scoutit.space"])("refuses foreign origin %s", async (source) => {
    for (const [handler, method] of [[POST, "POST"], [DELETE, "DELETE"]]) {
      const response = await handler(request(method, source));
      expect(response.status).toBe(403);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
    expect(staff).not.toHaveBeenCalled();
  });

  it.each([
    [401, undefined], [403, undefined], [403, "mfa_enrollment_required"], [403, "mfa_required"], [503, undefined],
  ])("never sets a cookie when staff authorization returns %i %s", async (status, code) => {
    staff.mockResolvedValue({ error: "Denied", status, code });
    const response = await POST(request("POST"));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: "Denied", ...(code ? { code } : {}) });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("issues only a sealed path-scoped cookie and clears it without consulting Auth", async () => {
    staff.mockResolvedValue({ userId: "fixture-staff" });
    const response = await POST(request("POST"));
    const options = adminPageCookieOptions();
    const header = response.headers.get("set-cookie");
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(header).toContain(options.name + "=");
    for (const property of ["Path=/admin", "Max-Age=300", "Secure", "HttpOnly", "SameSite=strict"]) {
      expect(header).toContain(property);
    }
    expect(header).not.toContain("Domain=");
    expect(header).not.toContain(bearer);
    expect(readAdminPageSession(response.cookies.get(options.name).value)).toBe(bearer);
    expect(GET).toBeUndefined();
    staff.mockClear();
    const logout = await DELETE(request("DELETE"));
    expect(logout.status).toBe(204);
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(logout.headers.get("set-cookie")).toContain("Path=/admin");
    expect(staff).not.toHaveBeenCalled();
  });

  it("fails closed when the environment key is absent", async () => {
    staff.mockResolvedValue({ userId: "fixture-staff" });
    vi.stubEnv("SCOUTIT_ADMIN_SESSION_KEY", "");
    const response = await POST(request("POST"));
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("uses the public Host and TLS protocol at a reverse proxy", async () => {
    staff.mockResolvedValue({ userId: "fixture-staff" });
    const behindProxy = (source) => new Request("http://127.0.0.1:3088/api/admin/session", {
      method: "POST",
      headers: {
        Origin: source, Host: "www.scoutit.space",
        "X-Forwarded-Proto": "https", "X-Forwarded-Host": "other.scoutit.space",
      },
    });
    expect((await POST(behindProxy("https://www.scoutit.space"))).status).toBe(204);
    expect((await POST(behindProxy("https://other.scoutit.space"))).status).toBe(403);
    expect((await POST(behindProxy("http://127.0.0.1:3088"))).status).toBe(403);
    expect(staff).toHaveBeenCalledTimes(1);
  });
});

describe("staff page authorization", () => {
  it.each(["cross-site", "same-site"])("requires staff re-entry on %s navigation before reading cookies", async (site) => {
    documentHeaders.mockResolvedValue(new Headers({ "sec-fetch-site": site }));
    await expect(requireAdminPage("/admin")).rejects.toThrow("/admin/access?next=%2Fadmin");
    expect(cookie).not.toHaveBeenCalled();
    expect(staff).not.toHaveBeenCalled();
  });

  it.each([undefined, "invalid", "expired"])("redirects a direct request with a %s cookie before identity lookup", async (value) => {
    cookie.mockReturnValue(value && { value: value === "expired" ? sealAdminPageSession(bearer, 0) : value });
    await expect(requireAdminPage("/admin/flow")).rejects.toThrow("/admin/access?next=%2Fadmin%2Fflow");
    expect(staff).not.toHaveBeenCalled();
  });

  it.each(["revoked role", "revoked MFA", "provider outage"])("rechecks current privileges and denies %s", async (condition) => {
    cookie.mockReturnValue({ value: sealAdminPageSession(bearer) });
    staff.mockResolvedValueOnce({ userId: "fixture-staff" });
    await expect(requireAdminPage("/admin")).resolves.toBeUndefined();
    expect(staff.mock.calls[0][0].headers.get("authorization")).toBe("Bearer " + bearer);
    staff.mockResolvedValueOnce({ error: condition, status: condition === "provider outage" ? 503 : 403 });
    await expect(requireAdminPage("/admin")).rejects.toThrow("/admin/access?next=%2Fadmin");
    expect(staff).toHaveBeenCalledTimes(2);
  });

  it("allows only literal staff destinations on entry and re-entry", () => {
    expect(adminReturnPath("/admin/flow")).toBe("/admin/flow");
    for (const candidate of ["//other.test", "/admin/flow?next=https://other.test", "/admin/access", ["/admin/flow"]]) {
      expect(adminEntryFor(candidate)).toBe("/admin/access?next=%2Fadmin");
    }
  });
});
