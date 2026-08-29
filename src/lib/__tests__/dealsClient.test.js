import { beforeEach, describe, expect, it, vi } from "vitest";

const crmFetch = vi.fn();
vi.mock("../crmClient", () => ({ crmFetch: (...args) => crmFetch(...args) }));

const { loadDeals } = await import("../deals/dealsClient");

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

describe("A-052 deal list request coalescing", () => {
  beforeEach(() => {
    crmFetch.mockReset();
  });

  it("serves concurrent callers from one request", async () => {
    const gate = deferred();
    crmFetch.mockReturnValue(gate.promise);

    const first = loadDeals({ mockUserId: "user-1" });
    const second = loadDeals({ mockUserId: "user-1" });

    expect(crmFetch).toHaveBeenCalledTimes(1);
    expect(crmFetch).toHaveBeenCalledWith("/api/deals", { mockUserId: "user-1" });

    gate.resolve({ deals: [{ id: "d1" }] });
    await expect(first).resolves.toEqual([{ id: "d1" }]);
    await expect(second).resolves.toEqual([{ id: "d1" }]);
  });

  it("does not cache — a later caller gets fresh rows", async () => {
    crmFetch.mockResolvedValueOnce({ deals: [{ id: "d1", status: "pending" }] });
    await expect(loadDeals()).resolves.toEqual([{ id: "d1", status: "pending" }]);

    // A status change between loads must be visible; a TTL cache would have
    // shown the stale row here.
    crmFetch.mockResolvedValueOnce({ deals: [{ id: "d1", status: "accepted" }] });
    await expect(loadDeals()).resolves.toEqual([{ id: "d1", status: "accepted" }]);
    expect(crmFetch).toHaveBeenCalledTimes(2);
  });

  it("never lets two identities share one response", async () => {
    const a = deferred();
    const b = deferred();
    crmFetch.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);

    const first = loadDeals({ mockUserId: "user-1" });
    const second = loadDeals({ mockUserId: "user-2" });
    expect(crmFetch).toHaveBeenCalledTimes(2);

    a.resolve({ deals: [{ id: "a" }] });
    b.resolve({ deals: [{ id: "b" }] });
    await expect(first).resolves.toEqual([{ id: "a" }]);
    await expect(second).resolves.toEqual([{ id: "b" }]);
  });

  it("shares a failure and then recovers on the next call", async () => {
    const gate = deferred();
    crmFetch.mockReturnValueOnce(gate.promise);

    const first = loadDeals();
    const second = loadDeals();
    gate.reject(new Error("offline"));

    await expect(first).rejects.toThrow("offline");
    await expect(second).rejects.toThrow("offline");

    // A failed request must not poison the slot.
    crmFetch.mockResolvedValueOnce({ deals: [{ id: "d1" }] });
    await expect(loadDeals()).resolves.toEqual([{ id: "d1" }]);
  });

  it("returns an array when the route sends no deals key", async () => {
    crmFetch.mockResolvedValueOnce({});
    await expect(loadDeals()).resolves.toEqual([]);
  });
});
