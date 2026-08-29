import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTE = "src/app/api/broker/recommendations/[id]/route.js";
const readCode = () =>
  readFileSync(resolve(process.cwd(), ROUTE), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

// ─────────────────────────────────────────────────────────────────────────
// A-023 gap G1, second half. Moderation publishes; withdrawal revokes consent.
// They are different actors and must not collapse into one permission.
// ─────────────────────────────────────────────────────────────────────────

describe("A-023 recommendation moderation and withdrawal", () => {
  it("gates the publish decision behind staff, not the author", () => {
    const code = readCode();
    expect(code).toContain("requireAdmin(request");
    expect(code).toMatch(/export async function PATCH[\s\S]{0,400}requireAdmin/);
  });

  it("gates withdrawal to the author and scopes it in the query itself", () => {
    const code = readCode();
    // Scoping inside the UPDATE means a guessed id still cannot withdraw
    // someone else's recommendation.
    expect(code).toMatch(/export async function DELETE[\s\S]*?\.eq\("author_user_id", userId\)/);
  });

  it("retains a withdrawn row instead of deleting the consent record", () => {
    const code = readCode();
    expect(code).toContain("withdrawn_at:");
    expect(code).not.toMatch(/\.delete\(\)/);
  });

  it("refuses to approve a recommendation whose consent was withdrawn", () => {
    const code = readCode();
    // A moderator does not outrank a revoked consent.
    expect(code).toMatch(/moderation_state: action\.state[\s\S]*?\.is\("withdrawn_at", null\)/);
  });

  it("only accepts approve or reject, never an arbitrary state", () => {
    const code = readCode();
    expect(code).toContain("MODERATION_ACTIONS[body?.action]");
    expect(code).not.toMatch(/moderation_state:\s*body\./);
  });

  it("audits both actions and keeps responses private", () => {
    const code = readCode();
    expect(code).toContain("recommendation_approved");
    expect(code).toContain("recommendation_withdrawn");
    expect(code).toContain('"Cache-Control": "private, no-store"');
  });
});
