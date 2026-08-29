import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTE = "src/app/api/deals/[id]/export/route.js";
const path = () => resolve(process.cwd(), ROUTE);
// Comments are stripped before asserting, so a rule described in prose can
// never satisfy a check the code is supposed to satisfy.
const readCode = () =>
  readFileSync(path(), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

// ─────────────────────────────────────────────────────────────────────────
// A-043. The export is the one route that hands a complete conversation to a
// caller in a single response, so its two guards are the whole feature:
//
//   1. Only a party to the deal may export it, and
//   2. What is masked on screen stays masked in the file.
//
// (2) is the one that fails quietly. The screen decides masking from client
// state (`deal.handshakeState`); if this route trusted the same input, any
// party could unmask their counterparty's contact details before the
// handshake by asking for a download with the right query string.
// ─────────────────────────────────────────────────────────────────────────

describe("A-043 conversation export route", () => {
  it("exists at all", () => {
    expect(existsSync(path())).toBe(true);
  });

  it("refuses an unauthenticated caller before touching the database", () => {
    const code = readCode();
    expect(code).toContain("resolveUserId(request)");
    expect(code).toMatch(/if \(!userId\)[\s\S]{0,160}401/);
  });

  it("admits only a party to the deal, routed recipients included", () => {
    const code = readCode();
    expect(code).toContain("isRoutedDealRecipient");
    expect(code).toContain("buyer_id");
    expect(code).toContain("broker_id");
    expect(code).toContain("owner_id");
    expect(code).toMatch(/if \(!isParty\)[\s\S]{0,160}403/);
  });

  it("resolves the contact-reveal decision from deal_handshakes, server-side", () => {
    const code = readCode();
    expect(code).toContain("deal_handshakes");
    // Both signatures, or the completed status the database function sets.
    expect(code).toContain("party_a_signed_at");
    expect(code).toContain("party_b_signed_at");
    expect(code).toMatch(/contactRevealed/);
  });

  it("never takes the reveal decision from the caller", () => {
    const code = readCode();
    // The screen keeps `handshakeState` in React state. A route that read it
    // from the query string or body would let a caller unmask by asking.
    expect(code).not.toMatch(/contactRevealed\s*[:=]\s*(?:body|payload|searchParams|request)/);
    expect(code).not.toMatch(/searchParams\.get\(\s*["'](?:revealed|contactRevealed|handshakeState)["']/);
  });

  it("is rate limited per caller", () => {
    const code = readCode();
    expect(code).toContain("createRateLimiter");
    expect(code).toMatch(/allowed[\s\S]{0,200}429/);
  });

  it("logs who exported which thread and when", () => {
    const code = readCode();
    expect(code).toContain("writeAuditLog");
    expect(code).toContain("deal_conversation_exported");
  });

  it("returns the transcript as a downloadable file, not JSON", () => {
    const code = readCode();
    expect(code).toContain("Content-Disposition");
    expect(code).toContain("attachment");
    expect(code).toContain("text/plain");
    // The filename comes from the shared helper, which strips anything a
    // header cannot safely carry — never from the property title inline.
    expect(code).toContain("transcriptFilename");
  });

  it("builds the file through the shared transcript module", () => {
    const code = readCode();
    // A second formatter is a second place the masking rule can be forgotten.
    expect(code).toContain("buildTranscript");
  });

  it("does not leak internal error detail", () => {
    const code = readCode();
    expect(code).toContain("sanitizeError");
  });

  it("is a read-only GET and defines no write verb", () => {
    const code = readCode();
    expect(code).toMatch(/export async function GET\(/);
    expect(code).not.toMatch(/export async function (?:POST|PUT|PATCH|DELETE)\(/);
  });
});
