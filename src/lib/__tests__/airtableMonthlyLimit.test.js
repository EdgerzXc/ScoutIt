import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBrokers, resetAirtableMonthlyLimitCooldown } from "@/lib/airtable";
import { resetCircuits } from "@/lib/fetchWithRetry";

const monthlyLimit = () => new Response(
  JSON.stringify({ error: { type: "PUBLIC_API_BILLING_LIMIT_EXCEEDED" } }),
  { status: 429, headers: { "Content-Type": "application/json" } },
);

beforeEach(() => {
  resetAirtableMonthlyLimitCooldown();
  resetCircuits();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("U-042 Airtable monthly cap", () => {
  it("stops after one billing-limit response and avoids another call during cooldown", async () => {
    const fetchMock = vi.fn(async () => monthlyLimit());
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchBrokers("test-key", "test-base")).rejects.toMatchObject({
      code: "AIRTABLE_MONTHLY_LIMIT",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await expect(fetchBrokers("test-key", "test-base")).rejects.toMatchObject({
      code: "AIRTABLE_MONTHLY_LIMIT",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("continues to retry a short 429 that is not a billing cap", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { type: "RATE_LIMIT_REACHED" } }), { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ records: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchBrokers("test-key", "test-base")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
