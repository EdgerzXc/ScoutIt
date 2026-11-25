import { describe, it, expect } from "vitest";
import { resolveViaPromoter } from "../viaPromoter";
import { VIA_STATUS } from "../viaRouting";

describe("resolveViaPromoter — VIA parameter sanitization & boundary defense", () => {
  it("rejects invalid contact slugs with malicious or illegal characters", async () => {
    const maliciousSlugs = [
      "user.eq.123",
      "test%20slug",
      "slug,or(id.eq.admin)",
      "slug;DROP TABLE users;",
      "<script>alert(1)</script>",
      "",
      "a".repeat(81), // Exceeds 80 character limit
    ];

    for (const slug of maliciousSlugs) {
      const res = await resolveViaPromoter("bgc-penthouse", slug);
      expect(res).toEqual({ promoter: null, viaStatus: VIA_STATUS.INVALID });
    }
  });

  it("returns invalid status when property or promoter record is not found", async () => {
    const res = await resolveViaPromoter("nonexistent-property-slug-xyz", "valid-broker-slug");
    expect(res).toEqual({ promoter: null, viaStatus: VIA_STATUS.INVALID });
  });

  it("resolves valid promoter when property and active share link exist", async () => {
    const mockClient = {
      from: (table) => {
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: "prop-123" } }),
              }),
            }),
          };
        }
        if (table === "via_share_links") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { promoter_id: "user-456", status: "active" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "user-456",
                    display_name: "Elena Vance",
                    avatar_url: "https://example.com/avatar.jpg",
                    headline: "PRC Accredited Partner",
                    firm: "Ayala Alabang Premier",
                    is_profile_public: true,
                  },
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const res = await resolveViaPromoter("bgc-penthouse", "elena-vance", mockClient);
    expect(res.viaStatus).toBe(VIA_STATUS.VALID);
    expect(res.promoter.display_name).toBe("Elena Vance");
    expect(res.promoter.firm).toBe("Ayala Alabang Premier");
  });

  it("masks private profile details while preserving valid routing", async () => {
    const mockClient = {
      from: (table) => {
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: "prop-123" } }),
              }),
            }),
          };
        }
        if (table === "via_share_links") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { promoter_id: "user-456", status: "active" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "user-456",
                    display_name: "Secret Broker",
                    avatar_url: "https://example.com/secret.jpg",
                    headline: "Top Producer",
                    firm: "Confidential",
                    is_profile_public: false,
                  },
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const res = await resolveViaPromoter("bgc-penthouse", "secret-broker", mockClient);
    expect(res.viaStatus).toBe(VIA_STATUS.VALID);
    expect(res.promoter.id).toBe("user-456");
    expect(res.promoter.display_name).toBeNull();
    expect(res.promoter.avatar_url).toBeNull();
  });
});
