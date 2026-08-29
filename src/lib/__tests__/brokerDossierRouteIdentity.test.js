import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────
// A-023 phase 3. The editor's whole promise is "exact preview": the same
// presentational component renders the public dossier and the preview pane.
// `authorize()` computed the public identity and then every response threw it
// away, so the preview could only ever say "Public identity preview is
// unavailable." — the half of the feature the phase exists to deliver.
//
// The second test is the one that matters. Ownership is checked through
// `resolveBrokerAuthorityId`, which lower-cases before matching, while the
// broker lookup used a raw `===`. An uppercase Airtable BrokerID therefore
// passed the authority gate and resolved to no broker at all: authorized, and
// silently identity-less. Same visible symptom, different cause.
// ─────────────────────────────────────────────────────────────────────────

const BROKER_UUID = "e7f3634b-65d7-4adc-90ea-0544b61d988d";

const resolveUserId = vi.fn(async () => BROKER_UUID);
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: (...a) => resolveUserId(...a) }));

const getCmsBundle = vi.fn();
vi.mock("@/lib/cmsCache", () => ({
  getCmsBundle: (...a) => getCmsBundle(...a),
  invalidateCmsBundle: vi.fn(async () => {}),
}));

vi.mock("@/lib/featureFlags", () => ({ isGlobalReadOnly: vi.fn(async () => false) }));

const loadBrokerDossierDraft = vi.fn();
vi.mock("@/lib/serverBrokerDossierDraft", () => ({
  hasBrokerDossierAuthority: (userId, brokers = []) =>
    brokers.some((b) => String(b?.id || "").toLowerCase() === String(userId || "").toLowerCase()),
  loadBrokerDossierDraft: (...a) => loadBrokerDossierDraft(...a),
  saveBrokerDossierDraft: vi.fn(),
  markBrokerDossierPublished: vi.fn(),
}));

const { GET } = await import("@/app/api/broker/dossier/route");

const brokerRecord = (id) => ({
  id,
  name: "Marco Villanueva",
  title: "Commercial Advisor",
  specialty: "Office",
  location: "BGC, Taguig",
  bio: "Existing published biography.",
  image: "https://example.com/portrait.jpg",
  license: "PRC-0001",
  licenseVerified: true,
  clearanceTier: "Verified",
});

const request = () => new Request("https://www.scoutit.space/api/broker/dossier");

describe("/api/broker/dossier identity for the exact preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveUserId.mockResolvedValue(BROKER_UUID);
    getCmsBundle.mockResolvedValue({ source: "airtable", brokers: [brokerRecord(BROKER_UUID)] });
    loadBrokerDossierDraft.mockResolvedValue({ ok: true, record: { revision: 0, draft: {} } });
  });

  it("returns the public identity beside the draft so the preview can render", async () => {
    const body = await (await GET(request())).json();
    expect(body.record).toBeTruthy();
    expect(body.identity?.name).toBe("Marco Villanueva");
  });

  it("still returns the identity when private draft storage is unavailable", async () => {
    loadBrokerDossierDraft.mockResolvedValue({ ok: false, reason: "schema_unavailable" });
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.reason).toBe("schema_unavailable");
    expect(body.identity?.name).toBe("Marco Villanueva");
  });

  it("resolves the broker by Auth UUID the same way ownership does", async () => {
    getCmsBundle.mockResolvedValue({
      source: "airtable",
      brokers: [brokerRecord(BROKER_UUID.toUpperCase())],
    });
    const body = await (await GET(request())).json();
    expect(body.identity?.name).toBe("Marco Villanueva");
  });
});
