import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildRecommendationSection } from "@/lib/brokerRecommendations";

// ─────────────────────────────────────────────────────────────────────────
// A-064 — "Verified ScoutIt connection" must be resolved, never claimed.
//
// The projection awards the badge on the mere presence of a uuid in
// `qualifying_handshake_id`, and that column has no foreign key. Two seeded
// rows were found publicly claiming a verified connection through ids that
// resolve to nothing.
//
// The loader now confirms each id against `deal_handshakes` and clears the
// ones that do not resolve, so these tests pin the two things that matter:
// an unconfirmable claim loses the badge but keeps its words, and a lookup
// failure fails the read rather than silently stripping every badge.
// ─────────────────────────────────────────────────────────────────────────

const LOADER = "src/lib/serverBrokerSocialProof.js";
const MIGRATION = "supabase/migrations/20260831000002_recommendation_handshake_integrity.sql";
const readFile = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("the loader resolves the verified claim", () => {
  const code = readFile(LOADER);

  it("looks the claimed handshakes up in the authority", () => {
    expect(code).toContain('.from("deal_handshakes")');
    expect(code).toMatch(/\.in\("id", claimed\)/);
  });

  it("clears only an unconfirmable id, and never edits the stored row", () => {
    expect(code).toMatch(
      /row\.qualifying_handshake_id && !confirmed\.has\(row\.qualifying_handshake_id\)[\s\S]*qualifying_handshake_id: null/,
    );
    // A read path must not write. No update/delete anywhere in this module.
    expect(code).not.toMatch(/\.update\(|\.delete\(|\.upsert\(/);
  });

  it("fails the whole read when the confirmation lookup fails", () => {
    // Silently downgrading every entry to unverified during a database blip
    // would be its own dishonesty.
    expect(code).toMatch(/if \(confirmed === null\) return \{ ok: false, reason: "authority_unavailable" \}/);
  });

  it("does not query when nothing claims a handshake", () => {
    expect(code).toMatch(/if \(!claimed\.length\) return new Set\(\)/);
  });
});

describe("the projection's label follows the resolved value", () => {
  const publishable = (overrides = {}) => ({
    id: "r1",
    broker_id: "b1",
    attribution_mode: "anonymous",
    author_display_name: "",
    relationship_type: "",
    body: "Marco found us 1,200 sqm in BGC on a compressed timeline.",
    moderation_state: "approved",
    consent_granted: true,
    withdrawn_at: null,
    disputed_at: null,
    submitted_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  });

  it("labels a confirmed handshake as a verified connection", () => {
    const section = buildRecommendationSection({
      authorityId: "b1",
      lookup: {
        ok: true,
        recommendations: [publishable({ qualifying_handshake_id: "real-handshake" })],
      },
    });

    expect(section.cards[0].verified).toBe(true);
    expect(section.cards[0].sourceLabel).toBe("Verified ScoutIt connection");
  });

  it("labels a cleared claim as client-submitted, keeping the words", () => {
    // This is the state the loader produces for a dangling id.
    const section = buildRecommendationSection({
      authorityId: "b1",
      lookup: {
        ok: true,
        recommendations: [publishable({ qualifying_handshake_id: null })],
      },
    });

    const entry = section.cards[0];
    expect(entry.verified).toBe(false);
    expect(entry.sourceLabel).toBe("Client-submitted · unverified");
    expect(entry.body).toContain("1,200 sqm in BGC");
  });

  it("never leaves an entry unlabelled", () => {
    const section = buildRecommendationSection({
      authorityId: "b1",
      lookup: {
        ok: true,
        recommendations: [
          publishable({ id: "a", qualifying_handshake_id: "real" }),
          publishable({ id: "b", qualifying_handshake_id: null }),
        ],
      },
    });

    for (const entry of section.cards) {
      expect(entry.sourceLabel).toBeTruthy();
    }
  });
});

describe("the prepared migration makes it an invariant", () => {
  const sql = readFile(MIGRATION);

  it("is prepared only and routed through W-003", () => {
    expect(sql).toMatch(/PREPARED ONLY/);
    expect(sql).toMatch(/W-003/);
  });

  it("clears dangling claims before adding the constraint", () => {
    const update = sql.indexOf("UPDATE public.broker_recommendations");
    const addConstraint = sql.indexOf("ADD CONSTRAINT broker_recommendations_qualifying_handshake_fkey");
    expect(update).toBeGreaterThan(-1);
    expect(addConstraint).toBeGreaterThan(update);
  });

  it("clears the claim without deleting the consent record", () => {
    expect(sql).toMatch(/SET qualifying_handshake_id = NULL/);
    expect(sql).not.toMatch(/DELETE\s+FROM\s+public\.broker_recommendations/i);
  });

  it("restricts deletion of a handshake a published recommendation depends on", () => {
    expect(sql).toMatch(/REFERENCES public\.deal_handshakes\(id\)\s*\n?\s*ON DELETE RESTRICT/);
  });
});
