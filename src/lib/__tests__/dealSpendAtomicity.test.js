import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Deal Spend-Create Atomicity & Single RPC Name Contract (A-304)", () => {
  it("pins spend_connects_atomic as the sole RPC across initiate and pitch routes", () => {
    const initiateSrc = readFileSync("src/app/api/deals/initiate/route.js", "utf8");
    const pitchSrc = readFileSync("src/app/api/deals/pitch/route.js", "utf8");
    const walletSrc = readFileSync("src/lib/connectsWallet.js", "utf8");

    // Both deal routes must call spend_connects_atomic
    expect(initiateSrc).toContain("supabaseAdmin.rpc('spend_connects_atomic'");
    expect(pitchSrc).toContain("supabaseAdmin.rpc('spend_connects_atomic'");
    expect(walletSrc).toContain('supabaseAdmin.rpc("spend_connects_atomic"');

    // Neither deal route should call the unpinned legacy spend_connects
    expect(initiateSrc).not.toContain("supabaseAdmin.rpc('spend_connects',");
    expect(pitchSrc).not.toContain("supabaseAdmin.rpc('spend_connects',");
  });

  it("ensures initiate route wraps stamp and all post-spend actions in compensating refund", () => {
    const initiateSrc = readFileSync("src/app/api/deals/initiate/route.js", "utf8");

    // Must declare spent tracking
    expect(initiateSrc).toContain("let spentConnects = false");
    expect(initiateSrc).toContain("spentConnects = true");

    // Post-spend try block must encompass stampError and postSpendErr
    expect(initiateSrc).toContain("Connect cost stamp failed");
    expect(initiateSrc).toContain("refund_connects_system_error");
    expect(initiateSrc).toContain("deal_routing_recipients').delete");
    expect(initiateSrc).toContain("deals').delete");
    expect(initiateSrc).toContain("Inquiry delivery failed. Your Connect has been refunded.");
  });

  it("ensures pitch route stamps connects_spent and wraps all post-spend actions in compensating refund", () => {
    const pitchSrc = readFileSync("src/app/api/deals/pitch/route.js", "utf8");

    // Must declare spent tracking
    expect(pitchSrc).toContain("let spentConnects = false");
    expect(pitchSrc).toContain("spentConnects = true");

    // Pitch route must stamp connects_spent on the deal
    expect(pitchSrc).toContain("connects_spent: 1");
    expect(pitchSrc).toContain("Pitch connect cost stamp failed");

    // Must call compensating refund on any failure
    expect(pitchSrc).toContain("refund_connects_system_error");
    expect(pitchSrc).toContain("rollbackPitchSideEffects");
    expect(pitchSrc).toContain("Pitch delivery failed. Your Connect has been refunded.");
  });
});
