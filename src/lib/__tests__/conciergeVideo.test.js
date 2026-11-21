import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VIDEO_MAX_BYTES } from "@/lib/conciergeVideo";
import { submitConciergeVideo } from "@/lib/conciergeVideoClient";

const mock = vi.hoisted(() => ({
  user: vi.fn(),
  tier: vi.fn(),
  rpc: vi.fn(),
  info: vi.fn(),
  download: vi.fn(),
  sign: vi.fn(),
  lookup: vi.fn(),
  filters: vi.fn(),
  cleanup: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: mock.user, resolveServerTier: mock.tier }));
vi.mock("@/lib/cronEventLog", () => ({ withCronEventLog: (_job, handler) => handler }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    storage: {
      from: () => ({ info: mock.info, download: mock.download, createSignedUploadUrl: mock.sign, remove: mock.remove }),
    },
    rpc: mock.rpc,
    from: () => {
      const cleanupStep = (method, ...args) => {
        mock.cleanup(method, ...args);
        return query;
      };
      let deleting = false;
      const query = {
        select: (columns) => deleting ? mock.cleanup("removed", columns) : query,
        eq: (column, value) => { mock.filters(column, value); return query; },
        maybeSingle: mock.lookup,
        is: (...args) => cleanupStep("is", ...args),
        lte: (...args) => cleanupStep("lte", ...args),
        order: (...args) => cleanupStep("order", ...args),
        limit: (...args) => mock.cleanup("limit", ...args),
        delete: () => { deleting = true; return cleanupStep("delete"); },
        in: (...args) => cleanupStep("in", ...args),
      };
      return query;
    },
  },
}));

import { POST } from "@/app/api/storage/upload/route";
import { GET as purgeExpired } from "@/app/api/cron/purge-expired-concierge-videos/route";

const owner = "10000000-1000-4000-8000-100000000001";
const property = "10000000-1000-4000-8000-100000000002";
const id = "10000000-1000-4000-8000-100000000003";
const path = `${owner}/${id}.mov`;
const init = { action: "init", id, propertyId: property, stylePreset: "modern_executive", filename: "Walkthrough.MOV", size: VIDEO_MAX_BYTES };
const complete = { action: "complete", id };
const reservation = {
  storage_path: path,
  declared_mime: "video/quicktime",
  size_bytes: VIDEO_MAX_BYTES,
  expires_at: "2100-01-01T00:00:00.000Z",
  completed_at: null,
};
const stored = { version: "version-controlled-fixture", size: VIDEO_MAX_BYTES, contentType: "video/quicktime" };

function request(body, type = "application/json") {
  return new Request("https://fixture.example/api/storage/upload", {
    method: "POST",
    headers: { "Content-Type": type },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function storageStream(text, cancel = vi.fn()) {
  const content = new TextEncoder().encode(text.padEnd(90));
  return new ReadableStream({
    start(controller) {
      controller.enqueue(content.subarray(0, 5));
      controller.enqueue(content.subarray(5));
    },
    cancel,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mock.user.mockResolvedValue(owner);
  mock.tier.mockResolvedValue({ tier: "cluster" });
  mock.rpc.mockImplementation(async (method) => ({
    data: method === "reserve_concierge_video_upload" ? { status: "reserved", path } : "completed",
  }));
  mock.sign.mockResolvedValue({ data: { token: "synthetic-upload-token" } });
  mock.lookup.mockResolvedValue({ data: reservation });
  mock.info.mockResolvedValue({ data: stored });
  mock.download.mockReturnValue({ asStream: () => ({ data: storageStream("0000ftypqt") }) });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("owner concierge video endpoint", () => {
  it("issues a private, no-overwrite capability for an owned listing at the size limit", async () => {
    const response = await POST(request({ ...init, ownerId: "untrusted client value" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      success: true, id, path, token: "synthetic-upload-token", contentType: "video/quicktime",
    });
    expect(mock.rpc).toHaveBeenCalledWith("reserve_concierge_video_upload", expect.objectContaining({
      p_owner: owner, p_property: property, p_size: VIDEO_MAX_BYTES, p_style: "modern_executive",
    }));
    expect(mock.sign).toHaveBeenCalledWith(path, { upsert: false });
  });

  it("denies unauthenticated, lower-tier and wrong-listing reservation requests", async () => {
    mock.user.mockResolvedValueOnce(null);
    expect((await POST(request(init))).status).toBe(401);
    mock.tier.mockResolvedValueOnce({ tier: "starry" });
    expect((await POST(request(init))).status).toBe(403);
    mock.rpc.mockResolvedValueOnce({ data: { status: "not_found" } });
    expect((await POST(request(init))).status).toBe(404);
    expect(mock.sign).not.toHaveBeenCalled();
  });

  it("rejects malformed, oversized, and disallowed input before asking storage to sign", async () => {
    expect((await POST(request(init, "text/plain"))).status).toBe(415);
    expect((await POST(request({ ...init, size: VIDEO_MAX_BYTES + 1 }))).status).toBe(413);
    expect((await POST(request({ ...init, stylePreset: "constructor" }))).status).toBe(400);
    expect((await POST(request({ ...init, filename: "folder/video.mov" }))).status).toBe(415);
    expect((await POST(request({ ...init, padding: "x".repeat(2048) }))).status).toBe(400);
    expect(mock.rpc).not.toHaveBeenCalled();
    expect(mock.sign).not.toHaveBeenCalled();
  });

  it("enforces the reservation budget and does not leak provider errors", async () => {
    mock.rpc.mockResolvedValueOnce({ data: { status: "limit" } });
    expect((await POST(request(init))).status).toBe(429);
    mock.sign.mockResolvedValue({ error: { message: "private provider response" } });
    const response = await POST(request(init));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private provider response");
  });

  it("checks object metadata, reads a split header, cancels the stream and commits by exact version", async () => {
    const cancel = vi.fn();
    mock.download.mockReturnValue({ asStream: () => ({ data: storageStream("0000ftypqt", cancel) }) });
    const response = await POST(request(complete));
    expect(await response.json()).toEqual({ success: true, id, status: "pending_scan" });
    expect(mock.filters.mock.calls).toEqual([["id", id], ["owner_id", owner]]);
    expect(mock.download).toHaveBeenCalledWith(path);
    expect(cancel).toHaveBeenCalledOnce();
    expect(mock.rpc).toHaveBeenCalledWith("complete_concierge_video_upload", {
      p_id: id, p_owner: owner, p_version: stored.version, p_detected_mime: "video/mp4",
    });
  });

  it("declines a missing, mismatched, or unrecognized upload without queueing it", async () => {
    mock.info.mockResolvedValueOnce({ error: { status: 404, statusCode: "NoSuchKey" } });
    expect(await (await POST(request(complete))).json()).toMatchObject({ code: "UPLOAD_INCOMPLETE" });
    mock.info.mockResolvedValueOnce({ data: { ...stored, size: 12 } });
    expect((await POST(request(complete))).status).toBe(415);
    mock.download.mockReturnValue({ asStream: () => ({ data: storageStream("Invalid") }) });
    expect((await POST(request(complete))).status).toBe(415);
    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it("does not read storage for expired sessions, a missing owner match or an existing receipt", async () => {
    mock.lookup.mockResolvedValueOnce({ data: null });
    expect((await POST(request(complete))).status).toBe(404);
    mock.lookup.mockResolvedValueOnce({ data: { ...reservation, expires_at: "2000-01-01" } });
    expect((await POST(request(complete))).status).toBe(410);
    mock.lookup.mockResolvedValueOnce({ data: { ...reservation, completed_at: "2026-11-21" } });
    expect(await (await POST(request(complete))).json()).toMatchObject({ id, status: "pending_scan" });
    expect(mock.info).not.toHaveBeenCalled();
  });

  it("reports an unavailable database commit instead of a receipt", async () => {
    mock.rpc.mockResolvedValue({ error: { message: "database failure" } });
    expect((await POST(request(complete))).status).toBe(503);
  });
});

describe("abandoned concierge video cleanup", () => {
  const cronUrl = "https://fixture.example/api/cron/purge-expired-concierge-videos";
  const secret = "synthetic-video-cron-token";
  const authorized = () => new Request(cronUrl, { headers: { Authorization: `Bearer ${secret}` } });

  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", secret);
    mock.cleanup.mockImplementation((action) => (
      action === "limit" ? { data: [{ id, storage_path: path }] } : { data: [{ id }] }
    ));
    mock.remove.mockResolvedValue({ data: [{ name: path }] });
  });

  it("denies unauthorized sweeps", async () => {
    expect((await purgeExpired(new Request(cronUrl))).status).toBe(401);
    expect(mock.cleanup).not.toHaveBeenCalled();
    expect(mock.remove).not.toHaveBeenCalled();
  });

  it("deletes only expired incomplete objects before removing their reservation", async () => {
    const now = new Date("2026-11-21T22:00:00Z");
    vi.spyOn(Date, "now").mockReturnValue(+now);
    const response = await purgeExpired(authorized());
    expect(await response.json()).toEqual({ cleared: 1, backlogPending: false });
    expect(mock.remove).toHaveBeenCalledWith([path]);
    expect(mock.cleanup).toHaveBeenCalledWith("in", "id", [id]);
    expect(mock.cleanup.mock.calls.filter(([step]) => step === "is"))
      .toEqual([["is", "completed_at", null], ["is", "completed_at", null]]);
    expect(mock.cleanup.mock.calls.filter(([step]) => step === "lte"))
      .toEqual(Array(2).fill(["lte", "expires_at", "2026-11-21T21:45:00.000Z"]));
    expect(mock.remove.mock.invocationCallOrder[0]).toBeLessThan(mock.cleanup.mock.invocationCallOrder.at(-1));
  });

  it("preserves the reservation when storage deletion fails so the job can retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mock.remove.mockResolvedValue({ error: { code: "storage-unavailable" } });
    expect((await purgeExpired(authorized())).status).toBe(500);
    expect(mock.cleanup).not.toHaveBeenCalledWith("delete");
  });
});

describe("video submission retry", () => {
  function client() {
    const authedFetch = vi.fn();
    const uploadToSignedUrl = vi.fn();
    const onStage = vi.fn();
    const file = new File(["0000ftypqt123456"], "walkthrough.mov", { type: "" });
    const operation = { id, propertyId: property, stylePreset: "modern_executive" };
    const run = () => submitConciergeVideo({
      authedFetch, storage: { from: () => ({ uploadToSignedUrl }) }, operation, file, onStage,
    });
    return { run, authedFetch, uploadToSignedUrl };
  }

  const signed = { success: true, id, path, token: "synthetic-signed-token", contentType: "video/quicktime" };
  const receipt = { success: true, id, status: "pending_scan" };

  it("sends the bytes only to private storage, then finishes a lost receipt without another upload", async () => {
    const { run, authedFetch, uploadToSignedUrl } = client();
    authedFetch.mockResolvedValueOnce(Response.json(signed))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(Response.json(receipt));
    uploadToSignedUrl.mockRejectedValueOnce(new TypeError("Connection closed after transfer"));

    await expect(run()).rejects.toThrow("Failed to fetch");
    await expect(run()).resolves.toEqual(receipt);
    expect(uploadToSignedUrl).toHaveBeenCalledOnce();
    expect(uploadToSignedUrl.mock.calls[0][2].type).toBe("video/quicktime");
    expect(authedFetch.mock.calls.map(([, options]) => JSON.parse(options.body).action))
      .toEqual(["init", "complete", "complete"]);
  });

  it("retries an interrupted transfer with the same operation ID", async () => {
    const { run, authedFetch, uploadToSignedUrl } = client();
    const incomplete = () => Response.json({ code: "UPLOAD_INCOMPLETE", error: "Try again." }, { status: 409 });
    authedFetch.mockResolvedValueOnce(Response.json(signed))
      .mockResolvedValueOnce(incomplete())
      .mockResolvedValueOnce(incomplete())
      .mockResolvedValueOnce(Response.json(signed))
      .mockResolvedValueOnce(Response.json(receipt));

    await expect(run()).rejects.toHaveProperty("code", "UPLOAD_INCOMPLETE");
    await expect(run()).resolves.toEqual(receipt);
    expect(uploadToSignedUrl).toHaveBeenCalledTimes(2);
    expect(authedFetch.mock.calls.every(([, options]) => JSON.parse(options.body).id === id)).toBe(true);
  });
});
