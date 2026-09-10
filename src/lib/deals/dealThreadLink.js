// The one way any surface links to a deal's conversation, and the one way the
// Inbox reads that link back.
//
// A-111: owner dossier cards had no route to their thread at all, and the
// Inbox kept its selection purely in component state with no reader for a
// query parameter -- so even a hand-written link had nowhere to land. Both
// ends now share these two functions. A writer and a reader that each spell
// the query key themselves is exactly how a deep link silently stops working.

/** The query key. Exported so a test can assert on it rather than a literal. */
export const DEAL_THREAD_PARAM = "dealId";

/**
 * Link to one deal's conversation. A missing or blank id degrades to the
 * Inbox itself rather than producing `?dealId=undefined`, which would be a
 * link that looks addressed and selects nothing.
 */
export function dealThreadHref(dealId) {
  const id = typeof dealId === "string" ? dealId.trim() : "";
  if (!id) return "/dashboard/inbox";
  return `/dashboard/inbox?${DEAL_THREAD_PARAM}=${encodeURIComponent(id)}`;
}

/**
 * Read the deal id back out of a `location.search` string. Returns null for
 * anything that is not a usable id, so the caller has one thing to check.
 */
export function readDealIdFromSearch(search) {
  if (typeof search !== "string" || search === "") return null;
  const id = (new URLSearchParams(search).get(DEAL_THREAD_PARAM) || "").trim();
  return id || null;
}
