import { describe, it, expect, vi, beforeEach } from "vitest";

// A-149: the appointments API resolves contact-exchange state server-side
// from the handshake rows. Proofs: mapping across states, fail-soft lookup,
// and the schedule widget's wiring pins.

const ME = "11111111-1111-4111-8111-111111111111";
const THEM = "22222222-2222-4222-8222-222222222222";

const state = vi.hoisted(() => ({
  appts: [],
  deals: [],
  props: [],
  profiles: [],
  handshakes: [],
  handshakeError: false,
}));

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => ME }));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => ({
      select: () => ({
        or: () => ({
          order: async () => ({ data: [...state.appts], error: null }),
        }),
        in: (...args) => {
          const run = async () => {
            if (table === "deals") return { data: [...state.deals], error: null };
            if (table === "properties") return { data: [...state.props], error: null };
            if (table === "user_profiles") return { data: [...state.profiles], error: null };
            if (table === "deal_handshakes") {
              if (state.handshakeError) return { data: null, error: { message: "boom" } };
              return { data: [...state.handshakes], error: null };
            }
            return { data: [], error: null };
          };
          const q = run();
          q.eq = () => run();
          return q;
        },
      }),
    }),
  },
}));

const { GET } = await import("@/app/api/viewing-appointments/route");

const appt = (over = {}) => ({
  id: "a1", deal_id: "d1", host_id: ME, guest_id: THEM, property_id: "p1",
  scheduled_at: "2026-10-01T06:00:00+08:00", ends_at: "2026-10-01T07:00:00+08:00",
  duration_minutes: 60, booked_timezone: "Asia/Manila", status: "confirmed",
  notes: null, created_at: "2026-09-01T00:00:00Z", meet_link: null, ...over,
});

const handshake = (over = {}) => ({
  deal_id: "d1", status: "pending", party_a_id: ME, party_b_id: THEM,
  party_a_signed_at: null, party_b_signed_at: null, ...over,
});

beforeEach(() => {
  state.appts = [appt()];
  state.deals = [{ id: "d1", status: "accepted" }];
  state.props = [{ id: "p1", title: "Tower One", slug: "tower-one" }];
  state.profiles = [{ id: THEM, display_name: "Gigi" }];
  state.handshakes = [];
  state.handshakeError = false;
});

const getExchange = async () => {
  const res = await GET(new Request("https://www.scoutit.space/api/viewing-appointments"));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.appointments).toHaveLength(1);
  return body.appointments[0];
};

describe("A-149 — appointments carry server-resolved contact exchange", () => {
  it("reports exchanged for a completed handshake", async () => {
    state.handshakes = [handshake({ status: "completed", party_a_signed_at: "2026-09-01", party_b_signed_at: "2026-09-02" })];
    const a = await getExchange();
    expect(a.contactExchange).toEqual({ state: "exchanged", offeredByMe: false });
    expect(a.dealId).toBe("d1");
  });

  it("attributes a pending offer to the signer", async () => {
    state.handshakes = [handshake({ party_a_signed_at: "2026-09-01T00:00:00Z" })];
    expect((await getExchange()).contactExchange).toEqual({ state: "offered", offeredByMe: true });
    state.handshakes = [handshake({ party_b_signed_at: "2026-09-01T00:00:00Z" })];
    expect((await getExchange()).contactExchange).toEqual({ state: "offered", offeredByMe: false });
  });

  it("offers when the deal is open and nothing exists yet", async () => {
    expect((await getExchange()).contactExchange).toEqual({ state: "offerable", offeredByMe: false });
  });

  it("withholds for terminal deals, cancelled viewings, and deal-less rows", async () => {
    state.deals = [{ id: "d1", status: "declined" }];
    expect((await getExchange()).contactExchange.state).toBe("unavailable");
    state.deals = [{ id: "d1", status: "accepted" }];
    state.appts = [appt({ status: "cancelled" })];
    expect((await getExchange()).contactExchange.state).toBe("unavailable");
    state.appts = [appt({ status: "confirmed", deal_id: null })];
    expect((await getExchange()).contactExchange.state).toBe("unavailable");
  });

  it("renders nothing on a failed handshake lookup — unknown, never guessed, never a 500", async () => {
    state.handshakeError = true;
    const res = await GET(new Request("https://www.scoutit.space/api/viewing-appointments"));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Null, not "offerable": offering against an unreadable state would be
    // the guess this whole item exists to prevent.
    expect(body.appointments[0].contactExchange).toBeNull();
  });
});

describe("A-149 — schedule widget wiring pins (TEXT: no component renderer here)", () => {
  const read = async (path) => (await import("node:fs")).readFileSync(path, "utf8");

  it("the appointment row drives the same handshake route the thread uses", async () => {
    const sheet = await read("src/components/dashboard/crm/AppointmentsSheet.js");
    expect(sheet).toContain("/api/deals/handshake");
    expect(sheet).toContain('action: "sign"');
    expect(sheet).toContain("Contacts exchanged");
    expect(sheet).toContain("Accept contact reveal");
    expect(sheet).toContain("Exchange contact");
    expect(sheet).toContain("Handshake offered — awaiting them");
  });

  it("the exchanged state carries no contact payload", async () => {
    const sheet = await read("src/components/dashboard/crm/AppointmentsSheet.js");
    const block = sheet.slice(sheet.indexOf("function ContactExchange"));
    expect(block).not.toMatch(/other_party_contact|wa\.me|phone|email/i);
  });
});
