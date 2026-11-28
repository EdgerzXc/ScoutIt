// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { GET, POST } from "../../app/api/community/signals/[id]/media/route";

const accountId = "31ff139c-e1f3-4995-a11f-0ec16ddfa736";
const signalId = "3d38ad9a-d5eb-4b59-befc-56f19787359c";
const mediaId = "91878f88-dc91-406b-a2cc-5f22c7a13136";
const route = { params: Promise.resolve({ id: signalId }) };
const url = `http://localhost/api/community/signals/${signalId}/media`;
const mocks = vi.hoisted(() => ({ from: vi.fn(), bucket: vi.fn(), auth: vi.fn(), isAdult: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: mocks.from, storage: { from: mocks.bucket } } }));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: mocks.auth, assertAdultEligibility: mocks.isAdult }));
vi.mock("@/lib/rateLimit", () => ({ createRateLimiter: () => () => ({ allowed: true }) }));

let post;
let row;
let bucket;

function db(table) {
  let write;
  let verb;
  const filters = {};
  const query = {
    select: () => query,
    eq: (key, value) => { filters[key] = value; return query; },
    or: () => query,
    insert: (value) => { verb = "insert"; write = value; return query; },
    update: (value) => { verb = "update"; write = value; return query; },
    single: () => {
      if (row) return { error: { code: "23505" } };
      row = { ...write, id: mediaId, state: "reserved" };
      return { data: row };
    },
    maybeSingle: () => {
      if (table === "stratosphere_signals") return { data: post };
      if (table === "user_profiles") return { data: { archived_at: null, is_shadowbanned: false } };
      if (!row || Object.entries(filters).some(([key, value]) => row[key] !== value)) return { data: null };
      if (verb === "update") row = { ...row, ...write };
      return { data: row };
    },
  };
  return query;
}

beforeEach(() => {
  vi.stubEnv("SCOUTIT_SIGNAL_MEDIA_ENABLED", "true");
  vi.stubEnv("SCOUTIT_SIGNAL_MEDIA_PILOT_GRANTS", JSON.stringify({ [accountId]: "solar" }));
  vi.stubEnv("SCOUTIT_SIGNAL_STREAM_ACCOUNT", "a".repeat(32));
  vi.stubEnv("SCOUTIT_SIGNAL_STREAM_CUSTOMER", "pilot123");
  vi.stubEnv("SCOUTIT_SIGNAL_STREAM_TOKEN", "test-token");
  post = { id: signalId, author_account_id: accountId, signal_type: "COMMERCIAL_PROMOTION", status: "live", last_confirmed_at: new Date().toISOString() };
  row = null;
  bucket = { upload: vi.fn().mockResolvedValue({}), createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://photo.example.test/private" } }) };
  mocks.from.mockImplementation(db);
  mocks.bucket.mockReturnValue(bucket);
  mocks.auth.mockResolvedValue(accountId);
  mocks.isAdult.mockResolvedValue(true);
});

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("signal media routes", () => {
  it("re-encodes a pilot upload, stages it privately and serves only an approved live asset", async () => {
    const original = await sharp({ create: { width: 3, height: 3, channels: 3, background: "orange" } }).png().toBuffer();
    const form = new FormData();
    form.set("photo", new File([original], "hosted-photo.png", { type: "image/png" }));
    form.set("position", "0");
    const result = await POST(new Request(url, { method: "POST", body: form }), route);
    expect(result.status).toBe(201);
    expect(row.state).toBe("review");
    expect(mocks.bucket).toHaveBeenCalledWith("signal-photos");
    expect((await sharp(bucket.upload.mock.calls[0][1]).metadata()).format).toBe("webp");
    const request = () => new Request(`${url}?asset=${mediaId}`);
    expect((await GET(request(), route)).status).toBe(404);
    expect(bucket.createSignedUrl).not.toHaveBeenCalled();
    row.state = "approved";
    const media = await GET(request(), route);
    expect(media.status).toBe(307);
    expect(media.headers.get("cache-control")).toBe("private, no-store");
    post.status = "closed";
    expect((await GET(request(), route)).status).toBe(404);
  });

  it("withholds video from Solar pilot members and media changes from non-authors", async () => {
    const start = () => new Request(url, { method: "POST", body: JSON.stringify({ action: "startVideo" }) });
    expect((await POST(start(), route)).status).toBe(403);
    mocks.auth.mockResolvedValue("cb2d3b25-a11d-40f7-9346-ff0d106a0849");
    expect((await POST(start(), route)).status).toBe(404);
    expect(row).toBeNull();
  });

  it("gives a Cluster promotion one private clip and issues playback only after approval", async () => {
    vi.stubEnv("SCOUTIT_SIGNAL_MEDIA_PILOT_GRANTS", JSON.stringify({ [accountId]: "cluster" }));
    const uid = "b".repeat(32);
    const provider = vi.fn((endpoint) => {
      if (endpoint.endsWith("/direct_upload")) return Response.json({ success: true, result: { uid, uploadURL: "https://upload.videodelivery.net/one-time" } });
      if (endpoint.endsWith("/token")) return Response.json({ success: true, result: { token: "signed.token" } });
      return Response.json({ success: true, result: { requireSignedURLs: true, readyToStream: true, duration: 29 } });
    });
    vi.stubGlobal("fetch", provider);
    const write = (action) => POST(new Request(url, { method: "POST", body: JSON.stringify({ action }) }), route);
    expect((await write("startVideo")).status).toBe(201);
    expect(JSON.parse(provider.mock.calls[0][1].body)).toMatchObject({ requireSignedURLs: true, maxDurationSeconds: 30 });
    expect(row).toMatchObject({ state: "reserved", kind: "video", position: 3, locator: uid });
    expect((await write("startVideo")).status).toBe(409);
    expect((await write("finishVideo")).status).toBe(200);
    const request = () => new Request(`${url}?asset=${mediaId}`);
    expect((await GET(request(), route)).status).toBe(404);
    row.state = "approved";
    expect(await (await GET(request(), route)).json()).toEqual({ playback: "https://customer-pilot123.cloudflarestream.com/signed.token/iframe" });
  });
});
