import {
  PROPERTY_LIFECYCLE_STATES,
  buildFirstPublicationUpdate,
  buildPermanentRemovalUpdate,
  buildWithdrawUpdate,
  canChangeDisplayTitle,
  canContactProperty,
  getRedirectSlug,
  isEntitledOffMarketViewer,
  isMarketVisible,
  normalizeLifecycleState,
} from "../propertyLifecycle";

describe("property lifecycle contract", () => {
  it("uses pipeline_status as the listing-live authority", () => {
    expect(normalizeLifecycleState({ pipeline_status: "approved", lifecycle_state: "draft" })).toBe(PROPERTY_LIFECYCLE_STATES.LIVE);
    expect(normalizeLifecycleState({ pipeline_status: "archived", lifecycle_state: "live" })).toBe(PROPERTY_LIFECYCLE_STATES.OFF_MARKET);
    expect(normalizeLifecycleState({ pipeline_status: "pending", lifecycle_state: "live" })).toBe(PROPERTY_LIFECYCLE_STATES.DRAFT);
    expect(normalizeLifecycleState({ pipeline_status: "unexpected", lifecycle_state: "live" })).toBe(PROPERTY_LIFECYCLE_STATES.DRAFT);
  });

  it("uses lifecycle_state only for pre-pipeline legacy rows", () => {
    expect(normalizeLifecycleState({ lifecycle_state: "live" })).toBe(PROPERTY_LIFECYCLE_STATES.LIVE);
    expect(normalizeLifecycleState({ lifecycle_state: "off_market" })).toBe(PROPERTY_LIFECYCLE_STATES.OFF_MARKET);
  });

  it("uses Airtable's computed slug only once and then freezes it", () => {
    expect(buildFirstPublicationUpdate({ current: { slug: "draft-title" }, computedSlug: "one-ecom-center" })).toMatchObject({
      slug: "one-ecom-center",
      canonical_slug: "one-ecom-center",
      lifecycle_state: "live",
      pipeline_status: "approved",
    });
    expect(buildFirstPublicationUpdate({ current: { canonical_slug: "old-slug", slug: "old-slug" }, computedSlug: "new-formula-slug" }).canonical_slug).toBe("old-slug");
  });

  it("blocks title changes once a canonical URL is reserved", () => {
    expect(canChangeDisplayTitle({ pipeline_status: "draft", slug: "draft-slug" })).toBe(true);
    expect(canChangeDisplayTitle({ pipeline_status: "approved", slug: "live-slug" })).toBe(false);
    expect(canChangeDisplayTitle({ lifecycle_state: "off_market", canonical_slug: "reserved" })).toBe(false);
  });

  it("withdraws without deleting and defaults quiet contact off", () => {
    expect(buildWithdrawUpdate({ now: "2026-08-02T00:00:00.000Z" })).toEqual({
      lifecycle_state: "off_market",
      pipeline_status: "off_market",
      withdrawn_at: "2026-08-02T00:00:00.000Z",
      quietly_open_to_offers: false,
    });
  });

  it("requires pipeline approval for public visibility and contact", () => {
    expect(isMarketVisible({ pipeline_status: "approved", lifecycle_state: "draft" })).toBe(true);
    expect(isMarketVisible({ lifecycle_state: "live" })).toBe(false);
    expect(canContactProperty({ pipeline_status: "approved" })).toBe(true);
    expect(canContactProperty({ lifecycle_state: "live" })).toBe(false);
    expect(canContactProperty({ lifecycle_state: "off_market" })).toBe(false);
    expect(canContactProperty({ lifecycle_state: "off_market", quietly_open_to_offers: true })).toBe(true);
    expect(canContactProperty({ lifecycle_state: "permanently_removed", quietly_open_to_offers: true })).toBe(false);
  });

  it("requires authentication plus entitlement for off-market reads", () => {
    expect(isEntitledOffMarketViewer({ tier: "starry" })).toBe(false);
    expect(isEntitledOffMarketViewer({ tier: "cluster" })).toBe(true);
    expect(isEntitledOffMarketViewer({ tier: "starry", lockerOpen: true })).toBe(true);
    expect(isEntitledOffMarketViewer({ tier: "starry", isOwner: true })).toBe(true);
  });

  it("resolves only an explicit historical redirect and never invents one", () => {
    expect(getRedirectSlug("Old-Title", [{ old_slug: "old-title", current_slug: "new-title" }])).toBe("new-title");
    expect(getRedirectSlug("unknown", [])).toBeNull();
  });

  it("builds retained, non-reactivatable removal metadata", () => {
    expect(buildPermanentRemovalUpdate({ actorId: "owner-1", reason: "No longer offered", now: "2026-08-02T00:00:00.000Z" })).toEqual({
      lifecycle_state: "permanently_removed",
      pipeline_status: "permanently_removed",
      permanently_removed_at: "2026-08-02T00:00:00.000Z",
      permanently_removed_by: "owner-1",
      permanently_removed_reason: "No longer offered",
      quietly_open_to_offers: false,
    });
  });
});
