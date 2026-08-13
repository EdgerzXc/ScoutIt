import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyUser, validateSampleNotificationRouting } from "@/lib/notifications";
import { SAMPLE_PROPERTY_SLUGS } from "@/lib/sampleInventory";

function clientForProperty({ slug = SAMPLE_PROPERTY_SLUGS[0], lookupError = null } = {}) {
  const inserted = [];
  const from = vi.fn((table) => {
    if (table === "properties") {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: lookupError ? null : { slug }, error: lookupError }) }),
        }),
      };
    }
    if (table === "user_notifications") {
      return { insert: async (rows) => { inserted.push(...rows); return { error: null }; } };
    }
    throw new Error(`Unexpected table: ${table}`);
  });
  return { from, inserted };
}

afterEach(() => {
  delete process.env.HUMAN_TEST_SAMPLE_RECIPIENT_IDS;
  vi.restoreAllMocks();
});

describe("sample notification routing", () => {
  it("allows only designated recipients for a known sample slug", async () => {
    process.env.HUMAN_TEST_SAMPLE_RECIPIENT_IDS = "tester-owner,tester-seeker";
    const client = clientForProperty();
    await expect(validateSampleNotificationRouting(client, {
      userId: "tester-owner", propertySlug: SAMPLE_PROPERTY_SLUGS[0],
    })).resolves.toEqual({ ok: true, sample: true });
    await expect(validateSampleNotificationRouting(client, {
      userId: "ordinary-owner", propertySlug: SAMPLE_PROPERTY_SLUGS[0],
    })).resolves.toMatchObject({ ok: false, sample: true, reason: "sample_recipient_not_allowlisted" });
  });

  it("resolves property IDs server-side and fails closed when classification cannot be proven", async () => {
    process.env.HUMAN_TEST_SAMPLE_RECIPIENT_IDS = "tester-owner";
    await expect(validateSampleNotificationRouting(clientForProperty(), {
      userId: "tester-owner", propertyId: "property-uuid",
    })).resolves.toEqual({ ok: true, sample: true });
    await expect(validateSampleNotificationRouting(clientForProperty({ lookupError: new Error("offline") }), {
      userId: "tester-owner", propertyId: "property-uuid",
    })).resolves.toEqual({ ok: false, sample: false, reason: "property_routing_unverified" });
  });

  it("blocks both the in-app write and email fallback before a non-designated sample notification", async () => {
    process.env.HUMAN_TEST_SAMPLE_RECIPIENT_IDS = "tester-owner";
    const client = clientForProperty();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await notifyUser(client, {
      userId: "ordinary-owner",
      title: "Sample inquiry",
      desc: "Should not leave the routing boundary",
      propertySlug: SAMPLE_PROPERTY_SLUGS[0],
      notificationType: "new_inquiry",
    });
    expect(result).toBeNull();
    expect(client.inserted).toEqual([]);
    expect(client.from).not.toHaveBeenCalledWith("user_notifications");
  });

  it("does not constrain notifications with no property context", async () => {
    await expect(validateSampleNotificationRouting(clientForProperty(), {
      userId: "ordinary-user",
    })).resolves.toEqual({ ok: true, sample: false });
  });
});
