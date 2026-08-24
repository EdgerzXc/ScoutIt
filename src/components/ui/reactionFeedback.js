// ---------------------------------------------------------------------------
// WHAT THE REACTION UI IS ALLOWED TO CLAIM — U-010 (client half)
//
// The old component ran setShowConfirm(true) on every path and rendered the
// fixed string "Saved to Your Board." That message was shown when the user
// REMOVED a reaction, when localStorage threw, and when nothing had been
// written at all. It was the same class of untruth as the server returning
// { ok: true } after a failed write.
//
// The distinction that matters, and the reason this is a table rather than an
// if-chain: Your Board lives in localStorage. The POST to /api/reactions is
// anonymous analytics. If the local write succeeded, THE USER'S ACTION
// SUCCEEDED — reporting a failure because a telemetry ping was rate-limited
// would be a new lie, not a fix for the old one. That path is deliberately
// silent here and reported to Sentry instead, where it belongs.
// ---------------------------------------------------------------------------

const FEEDBACK = Object.freeze({
  saved: { message: "Saved to Your Board.", tone: "confirm" },
  removed: { message: "Removed from Your Board.", tone: "confirm" },
  // Private browsing and a full quota both make setItem throw. The user pressed
  // a button and nothing was kept; they are entitled to know that.
  "storage-failed": {
    message: "This browser blocked the save.",
    tone: "warn",
  },
});

/**
 * @param {"idle"|"saved"|"removed"|"storage-failed"|"sync-failed"} status
 * @returns {{message: string, tone: "confirm"|"warn"}|null} null means say nothing
 */
export function reactionFeedback(status) {
  return FEEDBACK[status] || null;
}

export default reactionFeedback;
