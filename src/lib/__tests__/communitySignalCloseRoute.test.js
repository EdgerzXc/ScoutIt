import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/community/signals/[id]/close/route";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("@/lib/communityStore", () => ({ isMissingTable: (error) => error?.code === "42P01" }));

const callClose = () => POST(
  new Request("http://localhost/api/community/signals/live-1/close", { method: "POST" }),
  { params: Promise.resolve({ id: "live-1" }) }
);

function signalTable(signal, loadError = null) {
  const updateResult = { error: null };
  const updateEq = vi.fn(async () => updateResult);
  const update = vi.fn(() => ({ eq: updateEq }));
  const selectQuery = {
    eq: vi.fn(() => selectQuery),
    maybeSingle: vi.fn(async () => ({ data: signal, error: loadError })),
  };
  supabaseAdmin.from.mockReturnValue({
    select: vi.fn(() => selectQuery),
    update,
  });
  return { update, updateEq };
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveUserId.mockResolvedValue("author-account");
});

describe("author-only community signal close", () => {
  it("requires a verified account before reading the signal", async () => {
    resolveUserId.mockResolvedValue(null);
    const response = await callClose();
    expect(response.status).toBe(401);
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it("refuses another account without writing, even when the public card is visible", async () => {
    const { update } = signalTable({ id: "live-1", author_account_id: "other-account", status: "live" });
    const response = await callClose();
    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("closes the author's signal and treats a repeated close as idempotent", async () => {
    const { update, updateEq } = signalTable({ id: "live-1", author_account_id: "author-account", status: "live" });
    const response = await callClose();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, status: "closed" });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "closed" }));
    expect(updateEq).toHaveBeenCalledWith("id", "live-1");

    const closed = signalTable({ id: "live-1", author_account_id: "author-account", status: "closed" });
    const repeat = await callClose();
    expect(await repeat.json()).toMatchObject({ ok: true, deduped: true });
    expect(closed.update).not.toHaveBeenCalled();
  });

  it("reports unavailable storage instead of claiming closure", async () => {
    signalTable(null, { code: "42P01" });
    const response = await callClose();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false });
  });
});
