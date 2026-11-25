import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const UUID_USER = "11111111-1111-4111-8111-111111111111";
const UUID_OTHER = "22222222-2222-4222-8222-222222222222";
const UUID_PROP = "33333333-3333-4333-8333-333333333333";

function makeChain(resolveWith) {
  const result = typeof resolveWith === "function" ? resolveWith : () => resolveWith;
  const builder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    gte: () => builder,
    not: () => builder,
    is: () => builder,
    or: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => Promise.resolve(result()),
    maybeSingle: () => Promise.resolve(result()),
    then(onFulfilled, onRejected) {
      return Promise.resolve(result()).then(onFulfilled, onRejected);
    },
  };
  return builder;
}

describe("Pre-push hardening regression suite", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("POST /api/deals rejects spend_connects_atomic { success: false } with 403 and syncs remaining_total", async () => {
    const profileUpdates = [];
    const rpcCalls = [];
    const mockSupabaseAdmin = {
      from(table) {
        if (table === "properties") {
          return makeChain({ data: { id: UUID_PROP, title: "Tower", slug: "tower", owner_id: UUID_USER }, error: null });
        }
        if (table === "user_profiles") {
          return {
            select: () => makeChain({ data: { id: UUID_OTHER }, error: null }),
            update: (patch) => {
              profileUpdates.push(patch);
              return makeChain({ data: null, error: null });
            },
          };
        }
        if (table === "deals") {
          return makeChain({ data: [{ id: "deal-1" }], error: null });
        }
        return makeChain({ data: [], error: null });
      },
      rpc: vi.fn((fn, args) => {
        rpcCalls.push({ fn, args });
        if (fn === "spend_connects_atomic") {
          if (args.p_user_id === UUID_USER && rpcCalls.filter((c) => c.fn === "spend_connects_atomic").length === 1) {
            return Promise.resolve({
              data: [{ success: false, remaining_total: 0, spent_granted: 0, spent_purchased: 0, spent_reward: 0 }],
              error: null,
            });
          }
          return Promise.resolve({
            data: [{ success: true, remaining_total: 4, spent_granted: 1, spent_purchased: 0, spent_reward: 0 }],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    vi.doMock("@/lib/serverAuth", () => ({
      resolveUserId: vi.fn(async () => UUID_USER),
      assertAdultEligibility: vi.fn(async () => ({ ok: true })),
    }));
    vi.doMock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: mockSupabaseAdmin }));
    vi.doMock("@/lib/connectBlocks", () => ({ checkBlockGuard: vi.fn(async () => ({ ok: true, blocked: false })) }));
    vi.doMock("@/lib/connectGates", () => ({ checkReceiverGate: vi.fn(async () => ({ ok: true })) }));
    vi.doMock("@/lib/connectsWallet", () => ({ ensureConnectBalancesWallet: vi.fn(async () => null) }));
    vi.doMock("@/lib/crmActivity", () => ({ logActivity: vi.fn(async () => null) }));
    vi.doMock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => null) }));

    const { POST } = await import("@/app/api/deals/route");
    const makeReq = () =>
      new Request("https://www.scoutit.space/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: UUID_PROP,
          otherPartyEmail: UUID_OTHER,
          status: "pending",
          initialMessage: "Hello",
        }),
      });

    const deniedRes = await POST(makeReq());
    expect(deniedRes.status).toBe(403);
    expect(rpcCalls.some((c) => c.fn === "refund_connects_system_error")).toBe(false);

    const okRes = await POST(makeReq());
    expect(okRes.status).toBe(200);
    expect(profileUpdates).toContainEqual({ connects_balance: 4 });
  });

  it("POST /api/deals/initiate rejects { success: false } without refunding and normalizes operator -> owner", async () => {
    const rpcCalls = [];
    const deletedDeals = [];
    const mockSupabaseAdmin = {
      from(table) {
        if (table === "user_profiles") {
          return makeChain({
            data: { role: "operator", active_roles: ["operator"] },
            error: null,
          });
        }
        if (table === "properties") {
          return makeChain({
            data: {
              id: UUID_PROP,
              title: "Tower",
              slug: "tower",
              owner_id: UUID_OTHER,
              lifecycle_state: "live",
              pipeline_status: "approved",
              quietly_open_to_offers: false,
              details: {},
            },
            error: null,
          });
        }
        if (table === "deals") {
          return {
            select: () => makeChain({ data: [], error: null }),
            delete: () => ({
              eq: (_col, id) => {
                deletedDeals.push(id);
                return Promise.resolve({ error: null });
              },
            }),
            update: () => makeChain({ data: null, error: null }),
          };
        }
        if (table === "deal_routing_recipients") {
          return makeChain({ data: [], error: null });
        }
        return makeChain({ data: null, error: null });
      },
      rpc: vi.fn((fn, args) => {
        rpcCalls.push({ fn, args });
        if (fn === "create_routed_buyer_deal") {
          return Promise.resolve({
            data: [{ deal_id: "routed-deal-1", recipient_ids: [UUID_OTHER], routed_to_roster: false }],
            error: null,
          });
        }
        if (fn === "spend_connects_atomic") {
          return Promise.resolve({
            data: [{ success: false, remaining_total: 0, spent_granted: 0, spent_purchased: 0, spent_reward: 0 }],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    vi.doMock("@/lib/serverAuth", () => ({
      resolveUserId: vi.fn(async () => UUID_USER),
      assertAdultEligibility: vi.fn(async () => ({ ok: true })),
    }));
    vi.doMock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: mockSupabaseAdmin }));
    vi.doMock("@/lib/sampleInventory", () => ({ validateSampleInquiryRecipients: vi.fn(() => ({ ok: true })) }));
    vi.doMock("@/lib/connectBlocks", () => ({
      anyBlocked: vi.fn(async () => false),
      anyBlockedStrict: vi.fn(async () => ({ ok: true, blocked: false })),
      checkBlockGuard: vi.fn(async () => ({ ok: true, blocked: false })),
    }));
    vi.doMock("@/lib/connectGates", () => ({
      findRecentPendingDeal: vi.fn(async () => null),
      checkReceiverGate: vi.fn(async () => ({ ok: true })),
    }));
    vi.doMock("@/lib/openGate", () => ({
      freeInboundRecipient: vi.fn(() => false),
      isOpenGateAvailable: vi.fn(async () => false),
    }));
    vi.doMock("@/lib/connectsWallet", () => ({ ensureConnectBalancesWallet: vi.fn(async () => null) }));
    vi.doMock("@/lib/crmActivity", () => ({ logActivity: vi.fn(async () => null) }));
    vi.doMock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => null) }));

    const { POST } = await import("@/app/api/deals/initiate/route");
    const res = await POST(
      new Request("https://www.scoutit.space/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: UUID_PROP, role: "operator" }),
      })
    );

    expect(res.status).toBe(403);
    expect(deletedDeals).toContain("routed-deal-1");
    const spendCall = rpcCalls.find((c) => c.fn === "spend_connects_atomic");
    expect(spendCall?.args?.p_role).toBe("owner");
    expect(rpcCalls.some((c) => c.fn === "refund_connects_system_error")).toBe(false);
  });

  it("POST /api/deals/pitch rejects { success: false } with 403 and rolls back without refunding", async () => {
    const rpcCalls = [];
    const deletedDeals = [];
    const deletedReps = [];
    const mockSupabaseAdmin = {
      from(table) {
        if (table === "user_profiles") {
          return makeChain({ data: { role: "broker", active_roles: ["broker"], subscription_tier: "starry" }, error: null });
        }
        if (table === "properties") {
          return makeChain({ data: { id: UUID_PROP, slug: "tower", owner_id: UUID_OTHER, lifecycle_state: "live", pipeline_status: "approved" }, error: null });
        }
        if (table === "property_broker_representations") {
          return {
            select: () => makeChain({ data: null, error: null }),
            insert: () => makeChain({ data: { id: "rep-1" }, error: null }),
            delete: () => ({
              eq: (_col, id) => {
                deletedReps.push(id);
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        if (table === "deals") {
          return {
            select: () => makeChain({ data: [], error: null }),
            insert: () => makeChain({ data: [{ id: "pitch-deal-1" }], error: null }),
            delete: () => ({
              eq: (_col, id) => {
                deletedDeals.push(id);
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        return makeChain({ data: null, error: null });
      },
      rpc: vi.fn((fn, args) => {
        rpcCalls.push({ fn, args });
        if (fn === "spend_connects_atomic") {
          return Promise.resolve({
            data: [{ success: false, remaining_total: 0, spent_granted: 0, spent_purchased: 0, spent_reward: 0 }],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    vi.doMock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn(async () => UUID_USER) }));
    vi.doMock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: mockSupabaseAdmin }));
    vi.doMock("@/lib/sampleInventory", () => ({ validateSampleInquiryRecipients: vi.fn(() => ({ ok: true })) }));
    vi.doMock("@/lib/connectBlocks", () => ({ isBlocked: vi.fn(async () => false), checkBlockGuard: vi.fn(async () => ({ ok: true, blocked: false })) }));
    vi.doMock("@/lib/connectGates", () => ({ findRecentPendingDeal: vi.fn(async () => null), checkReceiverGate: vi.fn(async () => ({ ok: true })) }));
    vi.doMock("@/lib/connectsWallet", () => ({ ensureConnectBalancesWallet: vi.fn(async () => null) }));
    vi.doMock("@/lib/crmActivity", () => ({ logActivity: vi.fn(async () => null) }));
    vi.doMock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => null) }));

    const { POST } = await import("@/app/api/deals/pitch/route");
    const res = await POST(
      new Request("https://www.scoutit.space/api/deals/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: UUID_PROP, message: "Let me represent your asset." }),
      })
    );

    expect(res.status).toBe(403);
    expect(deletedDeals).toContain("pitch-deal-1");
    expect(deletedReps).toContain("rep-1");
    expect(rpcCalls.some((c) => c.fn === "refund_connects_system_error")).toBe(false);
  });

  it("POST /api/properties/updates/intent refuses IDOR fallback when owner owns 0 listings and handles null entries", async () => {
    vi.doMock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn(async () => UUID_USER) }));
    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: () => makeChain({ data: [], error: null }),
      },
    }));

    const { POST } = await import("@/app/api/properties/updates/intent/route");
    const res = await POST(
      new Request("https://www.scoutit.space/api/properties/updates/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Unit 1201 rent 45k",
          properties: [null, "bad", { id: "foreign-prop-1", title: "Foreign Tower" }],
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(JSON.stringify(body.updates || [])).not.toContain("Foreign Tower");
    expect(JSON.stringify(body.updates || [])).not.toContain("foreign-prop-1");
  });

  it("POST /api/properties/updates/intent fails closed with 503 when ownership query errors", async () => {
    vi.doMock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn(async () => UUID_USER) }));
    vi.doMock("@/lib/supabaseAdmin", () => ({
      supabaseAdmin: {
        from: () => makeChain({ data: null, error: { message: "connection timeout" } }),
      },
    }));

    const { POST } = await import("@/app/api/properties/updates/intent/route");
    const res = await POST(
      new Request("https://www.scoutit.space/api/properties/updates/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Unit 1201 rent 45k",
          properties: [{ id: "foreign-prop-1", title: "Foreign Tower" }],
        }),
      })
    );

    expect(res.status).toBe(503);
  });

  it("CategorySpecBlock MinorLockSection renders items in locked and unlocked (catMinor + deepIntel) states", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    let premiumFields = null;

    const ts = (await import("typescript")).default;
    const ReactMod = await import("react");
    const JsxRuntime = await import("react/jsx-runtime");
    const rawSrc = fs.readFileSync(path.resolve("src/components/property/CategorySpecBlock.js"), "utf8");
    const transformed = ts.transpileModule(rawSrc, {
      fileName: "CategorySpecBlock.jsx",
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        allowJs: true,
      },
    });
    const mod = { exports: {} };
    const localRequire = (specifier) => {
      if (specifier === "react") return ReactMod;
      if (specifier === "react/jsx-runtime") return JsxRuntime;
      if (specifier === "@/lib/usePremiumFields") {
        return { usePremiumFields: () => ({ fields: premiumFields }) };
      }
      throw new Error(`Unexpected import: ${specifier}`);
    };
    new Function("require", "exports", "module", transformed.outputText)(localRequire, mod.exports, mod);
    const CategorySpecBlock = mod.exports.default;

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const baseProperty = {
      slug: "tower-one",
      spaceCategory: "Commercial",
      cat: { commercial: { rentPerSqm: "1200", totalGLA: 15000 } },
    };

    await act(async () => {
      root.render(
        createElement(CategorySpecBlock, {
          property: baseProperty,
          extraLockedLabels: ["Zoning Note"],
        })
      );
    });

    const toggleLocked = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Deeper Intelligence")
    );
    expect(toggleLocked).toBeTruthy();
    expect(toggleLocked.textContent).toContain("Verified Scout");

    await act(async () => {
      toggleLocked.click();
    });
    expect(container.textContent).toContain("CAMC (CUSA)");
    expect(container.textContent).toContain("Zoning Note");
    expect(container.textContent).toContain("Solar Tier Unlocks This");

    premiumFields = {
      catMinor: { commercial: { camc: "PHP 180/sqm", capRate: 7.5 } },
      deepIntel: { "Zoning Note": "C-3 High Density" },
    };

    await act(async () => {
      root.render(
        createElement(CategorySpecBlock, {
          property: baseProperty,
          extraLockedLabels: ["Zoning Note"],
        })
      );
    });

    const toggleUnlocked = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Deeper Intelligence")
    );
    expect(toggleUnlocked.textContent).toContain("Unlocked");
    expect(container.textContent).toContain("PHP 180/sqm");
    expect(container.textContent).toContain("7.5%");
    expect(container.textContent).toContain("C-3 High Density");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("patchEvent forwards conferenceDataVersion=1 when called from createViewingMeet on 409 conflict", async () => {
    const fetchedUrls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        fetchedUrls.push({ url, method: init?.method });
        if (init?.method === "POST") {
          return new Response(JSON.stringify({ error: { message: "Already exists" } }), { status: 409 });
        }
        return new Response(
          JSON.stringify({
            id: "evt-1",
            hangoutLink: "https://meet.google.com/abc-defg-hij",
          }),
          { status: 200 }
        );
      })
    );
    vi.doMock("@/lib/calendar/connectionStore", () => ({
      getValidGoogleAccessToken: vi.fn(async () => "access-token-123"),
    }));

    const { createViewingMeet } = await import("@/lib/calendar/meetLink");
    const result = await createViewingMeet(UUID_USER, {
      appointmentId: "appt-1",
      scheduledAt: "2026-12-01T10:00:00.000Z",
    });

    expect(result.meetLink).toBe("https://meet.google.com/abc-defg-hij");
    expect(fetchedUrls.some((c) => c.method === "PATCH" && c.url.includes("conferenceDataVersion=1"))).toBe(true);
  });
});
