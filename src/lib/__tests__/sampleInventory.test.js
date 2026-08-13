import {
  SAMPLE_PROPERTY_SLUGS,
  isSamplePropertySlug,
  normalizeSampleBundle,
  parseSampleRecipientAllowlist,
  validateSampleInquiryRecipients,
} from "@/lib/sampleInventory";

describe("sample inventory inquiry isolation", () => {
  it("keeps the human-testing catalog fixed at seven slugs", () => {
    expect(SAMPLE_PROPERTY_SLUGS).toHaveLength(7);
    expect(new Set(SAMPLE_PROPERTY_SLUGS).size).toBe(7);
    expect(isSamplePropertySlug("THE-RIDGELINE-AT-CAPITOL-COMMONS")).toBe(true);
    expect(isSamplePropertySlug("real-owner-listing")).toBe(false);
  });

  it("fails safe when a cached sample record has a stale false flag", () => {
    const bundle = normalizeSampleBundle({
      properties: [
        { slug: SAMPLE_PROPERTY_SLUGS[0], is_sample: false },
        { slug: "real-owner-listing", is_sample: false },
      ],
      source: "upstash_redis",
    });

    expect(bundle.properties[0].is_sample).toBe(true);
    expect(bundle.properties[1].is_sample).toBe(false);
    expect(bundle.source).toBe("upstash_redis");
  });
  it("normalizes the designated recipient allowlist", () => {
    expect([...parseSampleRecipientAllowlist(" user-a, user-b, user-a ")]).toEqual(["user-a", "user-b"]);
  });

  it("fails closed for samples without configured and resolved test recipients", () => {
    const slug = SAMPLE_PROPERTY_SLUGS[0];
    expect(validateSampleInquiryRecipients({ slug, recipientIds: ["user-a"], allowlistValue: "" })).toMatchObject({ ok: false });
    expect(validateSampleInquiryRecipients({ slug, recipientIds: [], allowlistValue: "user-a" })).toMatchObject({ ok: false });
    expect(validateSampleInquiryRecipients({ slug, recipientIds: ["real-owner"], allowlistValue: "test-owner" })).toMatchObject({ ok: false });
  });

  it("allows samples only when every resolved recipient is designated", () => {
    expect(validateSampleInquiryRecipients({
      slug: SAMPLE_PROPERTY_SLUGS[0],
      recipientIds: ["test-owner", "test-broker"],
      allowlistValue: "test-owner,test-broker",
    })).toEqual({ ok: true, sample: true });
    expect(validateSampleInquiryRecipients({
      slug: "real-owner-listing",
      recipientIds: ["real-owner"],
      allowlistValue: "",
    })).toEqual({ ok: true, sample: false });
  });
});
