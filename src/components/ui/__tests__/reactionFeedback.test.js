import { describe, expect, it } from "vitest";
import { reactionFeedback } from "@/components/ui/reactionFeedback";

// The component used to call setShowConfirm(true) unconditionally and always
// render the words "Saved to Your Board." That was wrong in three separate
// ways, and this test pins all three.

describe("reactionFeedback", () => {
  it("confirms a save", () => {
    expect(reactionFeedback("saved")).toEqual({
      message: "Saved to Your Board.",
      tone: "confirm",
    });
  });

  it("does not claim a save when the reaction was removed", () => {
    const feedback = reactionFeedback("removed");

    expect(feedback.message).not.toContain("Saved to");
    expect(feedback.message).toBe("Removed from Your Board.");
    expect(feedback.tone).toBe("confirm");
  });

  it("reports honestly when this device could not store the reaction", () => {
    // Private-mode and full-quota browsers throw on setItem. The old code
    // caught that and showed a success message anyway.
    const feedback = reactionFeedback("storage-failed");

    expect(feedback.message).not.toContain("Saved to");
    expect(feedback.tone).toBe("warn");
  });

  it("stays silent when only the anonymous ping failed", () => {
    // The board lives in localStorage. If that write succeeded, the user's
    // action succeeded. Telling them otherwise because an analytics POST 502'd
    // would be a different lie, not a fix for the first one.
    expect(reactionFeedback("sync-failed")).toBeNull();
  });

  it("stays silent when idle", () => {
    expect(reactionFeedback("idle")).toBeNull();
  });
});
