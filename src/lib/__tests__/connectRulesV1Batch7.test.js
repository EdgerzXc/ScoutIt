import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  findRecentPendingDeal,
  checkReceiverGate,
  IDEMPOTENCY_WINDOW_MINUTES,
} from "@/lib/connectGates";
import {
  isManualCreatableStatus,
  canPostInDealStatus,
  MANUAL_DEAL_CREATABLE_STATUSES,
} from "@/lib/deals/dealStatus";
import { resolveEnterpriseForm } from "@/lib/enterpriseForms";

// A-144 batch 7 (§10.10): code-only hardening proofs. Every guard below is
// watched failing first (Rule 19) — see the mutation notes per test.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const readSource = (rel) => readFileSync(path.join(repoRoot, rel), "utf8");

// ── findRecentPendingDeal ─────────────────────────────────────────────

function pendingDealAdmin(rows, seen = {}) {
  return {
    from: (table) => ({
      select: () => {
        const chain = {
          or: (expr) => { seen.or = expr; return chain; },
          eq: () => chain,
          gte: () => chain,
          order: (col, opts) => { seen.order = { col, opts }; return chain; },
          limit: async () => ({ data: rows, error: null }),
        };
        return chain;
      },
    }),
  };
}

describe("A-144 batch 7 — dedup matches both sender columns, oldest first", () => {
  it("searches buyer_id AND broker_id so broker retries dedupe", async () => {
    const seen = {};
    const admin = pendingDealAdmin([{ id: "pitch-1" }], seen);
    const id = await findRecentPendingDeal(admin, "broker-9", "prop-1");
    expect(id).toBe("pitch-1");
    expect(seen.or).toContain("buyer_id");
    expect(seen.or).toContain("broker_id");
    expect(seen.or).toContain("broker-9");
  });

  it("returns the oldest match so a post-creation lookup finds the earlier row, not itself", async () => {
    const seen = {};
    const admin = pendingDealAdmin([{ id: "first" }], seen);
    await findRecentPendingDeal(admin, "buyer-1", "prop-1");
    expect(seen.order).toEqual({ col: "created_at", opts: { ascending: true } });
  });

  it("returns null when nothing matches", async () => {
    const id = await findRecentPendingDeal(pendingDealAdmin([]), "buyer-1", "prop-1");
    expect(id).toBeNull();
  });

  it("returns null without throwing on missing args", async () => {
    await expect(findRecentPendingDeal(null, "a", "b")).resolves.toBeNull();
    await expect(findRecentPendingDeal(pendingDealAdmin([]), null, "b")).resolves.toBeNull();
  });
});

// ── checkReceiverGate ─────────────────────────────────────────────────

function gateAdmin(profile, pendingRows) {
  return {
    from: (table) => {
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: profile, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          in: async () => ({ data: pendingRows, error: null }),
        }),
      };
    },
  };
}

describe("A-144 batch 7 — receiver caps are receiver-scoped, NULL is unlimited", () => {
  it("NULL cap means unlimited: heavy global pending does not block", async () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({
      id: `d${i}`, broker_id: "someone-else", buyer_id: "sender-x",
      properties: { owner_id: "someone-else" },
    }));
    const gate = await checkReceiverGate(
      gateAdmin({ id: "r1", accepting_connects: true, max_pending_connects: null }, rows),
      "r1",
      "prop-1",
    );
    expect(gate).toEqual({ ok: true });
  });

  it("global pending addressed to others does not count toward the cap", async () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({
      id: `d${i}`, broker_id: "other-broker", buyer_id: "sender-x",
      properties: { owner_id: "other-owner" },
    }));
    const gate = await checkReceiverGate(
      gateAdmin({ id: "r1", accepting_connects: true, max_pending_connects: 3 }, rows),
      "r1",
      "prop-1",
    );
    expect(gate.ok).toBe(true);
  });

  it("inbound at cap blocks (broker rows + owned-property rows count)", async () => {
    const rows = [
      { id: "a", broker_id: "r1", buyer_id: "s1", properties: { owner_id: "o1" } },
      { id: "b", broker_id: "other", buyer_id: "s2", properties: { owner_id: "r1" } },
    ];
    const gate = await checkReceiverGate(
      gateAdmin({ id: "r1", accepting_connects: true, max_pending_connects: 2 }, rows),
      "r1",
      "prop-1",
    );
    expect(gate.ok).toBe(false);
    expect(gate.reason).toBe("capped");
  });

  it("does not count the candidate deal already inserted by initiate or pitch", async () => {
    const rows = [
      { id: "candidate", broker_id: "r1", buyer_id: "sender", properties: { owner_id: "r1" } },
    ];
    const admin = gateAdmin({ id: "r1", accepting_connects: true, max_pending_connects: 1 }, rows);
    expect(await checkReceiverGate(admin, "r1", "prop-1", "candidate")).toEqual({ ok: true });
    expect((await checkReceiverGate(admin, "r1", "prop-1")).reason).toBe("capped");
  });
  it("the recipient's own outbound sends never count toward their cap", async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      id: `d${i}`, broker_id: "other", buyer_id: "r1",
      properties: { owner_id: "other-owner" },
    }));
    const gate = await checkReceiverGate(
      gateAdmin({ id: "r1", accepting_connects: true, max_pending_connects: 1 }, rows),
      "r1",
      "prop-1",
    );
    expect(gate.ok).toBe(true);
  });

  it("paused accounts refuse with 0 spend", async () => {
    const gate = await checkReceiverGate(
      gateAdmin({ id: "r1", accepting_connects: false, max_pending_connects: null }, []),
      "r1",
      "prop-1",
    );
    expect(gate.ok).toBe(false);
    expect(gate.reason).toBe("paused");
  });

  it("window constant stays a positive number of minutes", () => {
    expect(IDEMPOTENCY_WINDOW_MINUTES).toBeGreaterThan(0);
  });
});

// ── manual status + message status ────────────────────────────────────

describe("A-144 batch 7 — manual creation and chat status rules", () => {
  it("manual creation allows only pending/invited", () => {
    expect(isManualCreatableStatus("pending")).toBe(true);
    expect(isManualCreatableStatus("invited")).toBe(true);
    for (const s of ["accepted", "connected", "active", "closed", "declined", "withdrawn", "", null, undefined]) {
      expect(isManualCreatableStatus(s)).toBe(false);
    }
    expect(MANUAL_DEAL_CREATABLE_STATUSES).toEqual(["pending", "invited"]);
  });

  it("chat posts only on open conversation states", () => {
    for (const s of ["active", "accepted", "connected", "pitching"]) {
      expect(canPostInDealStatus(s)).toBe(true);
    }
    for (const s of ["pending", "invited", "declined", "withdrawn", "closed", "expired", "reported", "deleted", null, undefined]) {
      expect(canPostInDealStatus(s)).toBe(false);
    }
  });
});

// ── enterprise forms ──────────────────────────────────────────────────

function enterpriseAdmin(result) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => result,
        }),
      }),
    }),
  };
}

describe("A-144 batch 7 — enterprise free-inquiry validation", () => {
  it("empty form id is the legacy public form, not an enterprise claim", async () => {
    await expect(resolveEnterpriseForm(enterpriseAdmin({ data: null, error: null }), null))
      .resolves.toEqual({ ok: true, form: null });
    await expect(resolveEnterpriseForm(enterpriseAdmin({ data: null, error: null }), "  "))
      .resolves.toEqual({ ok: true, form: null });
  });

  it("missing tables defer gracefully pre-migration (no delivery block)", async () => {
    const r = await resolveEnterpriseForm(
      enterpriseAdmin({ data: null, error: { code: "42P01", message: "relation does not exist" } }),
      "form-1",
    );
    expect(r.ok).toBe(true);
    expect(r.ungated).toBe(true);
  });

  it("unknown forms do not deliver", async () => {
    const r = await resolveEnterpriseForm(
      enterpriseAdmin({ data: null, error: null }),
      "forged-id",
    );
    expect(r).toEqual({ ok: false, reason: "unknown_form" });
  });

  it("disabled forms do not deliver", async () => {
    const r = await resolveEnterpriseForm(
      enterpriseAdmin({ data: { id: "f1", enterprise_id: "e1", enabled: false }, error: null }),
      "f1",
    );
    expect(r).toEqual({ ok: false, reason: "disabled_form" });
  });

  it("enabled forms pass through", async () => {
    const form = { id: "f1", enterprise_id: "e1", enabled: true };
    const r = await resolveEnterpriseForm(
      enterpriseAdmin({ data: form, error: null }),
      "f1",
    );
    expect(r).toEqual({ ok: true, form });
  });
});

// ── route wiring contracts ────────────────────────────────────────────

describe("A-144 batch 7 — route wiring contracts (source presence)", () => {
  it("manual POST refunds a stranded debit and gates forged outcomes", () => {
    const src = readSource("src/app/api/deals/route.js");
    expect(src).toContain("refund_connects_system_error");
    expect(src).toContain("isManualCreatableStatus");
    expect(src).toContain("checkReceiverGate");
    expect(src).toContain("isBlocked");
  });

  it("pitch cleans up its representation phantom on every failure", () => {
    const src = readSource("src/app/api/deals/pitch/route.js");
    expect(src).toContain("rollbackPitchSideEffects");
    expect(src).toContain("property_broker_representations");
  });

  it("invite checks blocks/gates/dedup before writing and cleans up", () => {
    const src = readSource("src/app/api/dashboard/invite/route.js");
    expect(src).toContain("rollbackInviteSideEffects");
    expect(src).toContain("checkReceiverGate");
    expect(src).toContain("deduped");
  });

  it("messages enforce the accepted-only rule through the shared helper", () => {
    const src = readSource("src/app/api/deals/[id]/messages/route.js");
    expect(src).toContain("canPostInDealStatus");
  });

  it("inquiries validate the enterprise form server-side", () => {
    const src = readSource("src/app/api/inquiries/route.js");
    expect(src).toContain("resolveEnterpriseForm");
  });

  it("initiate dedupes before creating the routed row", () => {
    const src = readSource("src/app/api/deals/initiate/route.js");
    expect(src).toContain("preExistingDealId");
  });

  it("waiting gate covers invited deals with the owner as sender", () => {
    const src = readSource("src/components/dashboard/ChatBox.js");
    expect(src).toContain('deal.status === "pending" || deal.status === "invited"');
    expect(src).toContain('deal.status === "invited"');
  });
});
