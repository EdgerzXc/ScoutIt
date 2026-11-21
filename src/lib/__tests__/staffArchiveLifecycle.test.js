import { describe, expect, it, vi } from "vitest";
import { changePropertyArchiveState, isPropertyArchiveAuditAction } from "../../../mission-control/src/lib/propertyArchive.mjs";

const live = {
  slug: "live-listing",
  canonical_slug: "live-listing",
  pipeline_status: "approved",
  lifecycle_state: "live",
  moderation_status: "approved",
};
const now = "2026-11-21T00:00:00.000Z";

function operation(options = {}) {
  return {
    property: live,
    archive: true,
    reason: "Staff moderation",
    now,
    unpublish: vi.fn().mockResolvedValue({ recordId: "recFixture", cache: { purged: true } }),
    save: vi.fn().mockResolvedValue(true),
    ...options,
  };
}

describe("Mission Control archive consistency", () => {
  it("awaits confirmed public unpublish before saving the private archive", async () => {
    let finish;
    const input = operation({ unpublish: vi.fn(() => new Promise((resolve) => { finish = resolve; })) });
    const pending = changePropertyArchiveState(input);
    expect(input.unpublish).toHaveBeenCalledExactlyOnceWith("live-listing");
    expect(input.save).not.toHaveBeenCalled();
    finish({ recordId: "recFixture", cache: { purged: true } });
    await expect(pending).resolves.toEqual({ stage: "saved", cachePending: false });
    expect(input.save).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      archived_at: now, pipeline_status: "archived", lifecycle_state: "off_market", quietly_open_to_offers: false,
    }));
  });

  it.each([
    ["provider rejection", () => Promise.reject(new Error("synthetic provider error")), "airtable"],
    ["missing public record", () => Promise.resolve({ recordId: null }), "reference"],
  ])("keeps the private state when public removal cannot be verified (%s)", async (_label, unpublish, stage) => {
    const input = operation({ unpublish });
    await expect(changePropertyArchiveState(input)).resolves.toEqual({ stage });
    expect(input.save).not.toHaveBeenCalled();
  });

  it("reports reconciliation when the row changes after Airtable was updated", async () => {
    const input = operation({ save: vi.fn().mockResolvedValue(false) });
    await expect(changePropertyArchiveState(input)).resolves.toEqual({ stage: "supabase", publicChanged: true });
    expect(input.unpublish).toHaveBeenCalledTimes(1);
  });

  it("preserves a successful private archive when cache verification is pending", async () => {
    const input = operation({ unpublish: vi.fn().mockResolvedValue({ recordId: "recFixture", cache: { purged: false } }) });
    await expect(changePropertyArchiveState(input)).resolves.toEqual({ stage: "saved", cachePending: true });
    expect(input.save).toHaveBeenCalledTimes(1);
  });

  it("archives an unpublished draft even when its temporary slug matches a public slug", async () => {
    const input = operation({ property: { slug: live.slug, pipeline_status: "pending", lifecycle_state: "draft" } });
    await expect(changePropertyArchiveState(input)).resolves.toMatchObject({ stage: "saved" });
    expect(input.unpublish).not.toHaveBeenCalled();
  });

  it("restores a previously published archive to Pending while verifying public removal", async () => {
    const input = operation({ archive: false, property: { ...live, moderation_status: "archived", pipeline_status: "archived", lifecycle_state: "off_market" } });
    await expect(changePropertyArchiveState(input)).resolves.toMatchObject({ stage: "saved" });
    expect(input.unpublish).toHaveBeenCalledWith("live-listing");
    expect(input.save).toHaveBeenCalledWith(expect.objectContaining({ archived_at: null, pipeline_status: "pending", lifecycle_state: "draft" }));
  });

  it("rechecks public removal on an archive retry while preserving the original private archive", async () => {
    const input = operation({ property: { ...live, moderation_status: "archived", pipeline_status: "archived", lifecycle_state: "off_market" } });
    await expect(changePropertyArchiveState(input)).resolves.toMatchObject({ stage: "saved" });
    expect(input.unpublish).toHaveBeenCalledTimes(1);
    expect(input.save).not.toHaveBeenCalled();
  });

  it.each(["permanently_removed", "staff_suspended"])("rejects archive and restore for %s", async (lifecycle_state) => {
    for (const archive of [true, false]) {
      const input = operation({ archive, property: { ...live, lifecycle_state } });
      await expect(changePropertyArchiveState(input)).resolves.toEqual({ stage: "protected" });
      expect(input.unpublish).not.toHaveBeenCalled();
      expect(input.save).not.toHaveBeenCalled();
    }
  });

  it("keeps archive intent and result events out of generic audit replay", () => {
    expect(["property.archive", "property.archive.intent", "property.unarchive", "property.bulk_archive.intent"].every(isPropertyArchiveAuditAction)).toBe(true);
    expect(isPropertyArchiveAuditAction("property.approve")).toBe(false);
  });
});
