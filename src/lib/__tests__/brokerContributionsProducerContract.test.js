import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTE = "src/app/api/broker/contributions/route.js";
const readCode = () =>
  readFileSync(resolve(process.cwd(), ROUTE), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

// ─────────────────────────────────────────────────────────────────────────
// A-023 gap G2. Contributions are ScoutIt crediting a broker for work ScoutIt
// published. If a broker could create their own, a self-declared claim would
// be wearing a platform-credited label — the exact confusion the dossier's
// provenance rules exist to prevent. So this producer is staff-only.
// ─────────────────────────────────────────────────────────────────────────

describe("A-023 contribution crediting is staff-only", () => {
  it("gates both verbs behind requireAdmin", () => {
    const code = readCode();
    expect(code).toMatch(/export async function POST[\s\S]{0,500}requireAdmin/);
    expect(code).toMatch(/export async function PATCH[\s\S]{0,500}requireAdmin/);
    expect(code).not.toContain("resolveUserId");
  });

  it("validates the artifact path with the public projection's own resolver", () => {
    const code = readCode();
    // A row that could never render must never be stored.
    expect(code).toContain("resolveContributionHref(body.artifactPath)");
    expect(code).toContain("@/lib/brokerContributions");
  });

  it("accepts only the four known contribution kinds", () => {
    const code = readCode();
    expect(code).toContain("CONTRIBUTION_KIND_LABELS");
    expect(code).toContain("VALID_KINDS.has(kind)");
  });

  it("dates a published contribution, satisfying the schema constraint", () => {
    const code = readCode();
    expect(code).toMatch(/published_at: publish \? new Date\(\)\.toISOString\(\) : null/);
  });

  it("retracts rather than deletes, and audits both verbs", () => {
    const code = readCode();
    expect(code).toContain('status: "retracted"');
    expect(code).not.toMatch(/\.delete\(\)/);
    expect(code).toContain("contribution_published");
    expect(code).toContain("contribution_retracted");
  });

  it("keeps responses private and honours the global write freeze", () => {
    const code = readCode();
    expect(code).toContain('"Cache-Control": "private, no-store"');
    expect(code).toContain("isGlobalReadOnly()");
  });
});
