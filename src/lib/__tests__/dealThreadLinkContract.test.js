import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEAL_THREAD_PARAM,
  dealThreadHref,
  readDealIdFromSearch,
} from "@/lib/deals/dealThreadLink";

const read = (path) => readFileSync(path, "utf8");

// A-080 trap: a comment quoting the defect satisfies a guard that forbids it.
// Every source assertion below runs against comment-stripped text.
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const ownerMode = stripComments(read("src/components/dashboard/OwnerMode.js"));
const brokerMode = stripComments(read("src/components/dashboard/BrokerMode.js"));
const inbox = stripComments(read("src/app/dashboard/inbox/page.js"));

// A real deal id, taken from the shape /api/deals returns (deals.id is a uuid).
const REAL_DEAL_ID = "3f6c2a5e-9d41-4a2b-8f0c-1b7d4e2a9c58";

describe("A-111 deal thread deep link", () => {
  it("builds a link that carries a real deal id to the inbox", () => {
    expect(dealThreadHref(REAL_DEAL_ID)).toBe(
      `/dashboard/inbox?dealId=${REAL_DEAL_ID}`
    );
  });

  it("round-trips: what the card writes is what the inbox reads back", () => {
    const href = dealThreadHref(REAL_DEAL_ID);
    const search = href.slice(href.indexOf("?"));
    expect(readDealIdFromSearch(search)).toBe(REAL_DEAL_ID);
  });

  it("degrades to the inbox rather than emitting an unusable id", () => {
    expect(dealThreadHref(undefined)).toBe("/dashboard/inbox");
    expect(dealThreadHref(null)).toBe("/dashboard/inbox");
    expect(dealThreadHref("")).toBe("/dashboard/inbox");
    expect(dealThreadHref("   ")).toBe("/dashboard/inbox");
  });

  it("returns null for a search string with no usable deal id", () => {
    expect(readDealIdFromSearch("")).toBeNull();
    expect(readDealIdFromSearch("?tab=active")).toBeNull();
    expect(readDealIdFromSearch(`?${DEAL_THREAD_PARAM}=`)).toBeNull();
    expect(readDealIdFromSearch(`?${DEAL_THREAD_PARAM}=%20%20`)).toBeNull();
    expect(readDealIdFromSearch(undefined)).toBeNull();
  });

  it("escapes an id that would otherwise break out of the query string", () => {
    expect(dealThreadHref("a&b=c")).toBe("/dashboard/inbox?dealId=a%26b%3Dc");
    expect(readDealIdFromSearch("?dealId=a%26b%3Dc")).toBe("a&b=c");
  });
});

describe("A-111 both ends are wired, not just the helper", () => {
  it("owner dossier pitch cards link to their own thread", () => {
    expect(ownerMode).toContain("dealThreadHref(pitch.id)");
    expect(ownerMode).toContain("Open conversation");
  });

  it("the owner card no longer renders contact details it does not hold", () => {
    expect(ownerMode).not.toContain("brokerContact");
    expect(ownerMode).not.toContain("Direct Phone");
    expect(ownerMode).not.toContain("Direct Email");
  });

  it("the broker deal file links to its own thread rather than the inbox root", () => {
    // The standalone "Inbox" nav button is correctly the inbox root; it is the
    // deal file's own "Open conversation" link that has to be addressed.
    const openConversation = brokerMode.indexOf("Open conversation");
    expect(openConversation).toBeGreaterThan(-1);
    const link = brokerMode.lastIndexOf("<Link", openConversation);
    expect(brokerMode.slice(link, openConversation)).toContain("dealThreadHref(deal.id)");
  });

  it("the inbox reads the parameter and selects the matching deal", () => {
    expect(inbox).toContain("readDealIdFromSearch(window.location.search)");
    expect(inbox).toContain("setSelectedDealId(match.id)");
  });

  it("the inbox switches to the tab the deep-linked deal actually lives in", () => {
    // bucketOfDeal answers "closed"; the tab is named "declined". Setting the
    // bucket name directly would select a tab that renders nothing.
    expect(inbox).toContain("setInboxTab(tabForBucket(bucketOf(match)))");
    expect(inbox).toContain('bucket === "closed" ? "declined"');
  });

  it("a deleted deal is never deep-linkable", () => {
    expect(inbox).toContain("isDeleted(match.status)");
  });
});
