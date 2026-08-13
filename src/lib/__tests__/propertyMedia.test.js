import { describe, expect, it } from "vitest";
import {
  classifyPropertyMedia,
  imageMediaUrl,
  safeFloorPlans,
  spatialEmbedUrl,
  videoEmbedUrl,
} from "../propertyMedia.js";

describe("property media classification", () => {
  it("classifies images without ever treating them as iframe tours", () => {
    const image = "https://images.unsplash.com/photo-123?auto=format";
    expect(classifyPropertyMedia(image).kind).toBe("image");
    expect(spatialEmbedUrl(image, "luma")).toBe("");
    expect(spatialEmbedUrl(image, "matterport")).toBe("");
    expect(imageMediaUrl("https://v12.airtableusercontent.com/asset/photo")).toContain("airtableusercontent.com");
  });

  it("accepts provider-specific embed URLs only in their matching field", () => {
    const matterport = "https://my.matterport.com/show/?m=AbCdEf12345";
    const luma = "https://lumalabs.ai/embed/123e4567-e89b-12d3-a456-426614174000";
    expect(spatialEmbedUrl(matterport, "matterport")).toContain("my.matterport.com");
    expect(spatialEmbedUrl(matterport, "luma")).toBe("");
    expect(spatialEmbedUrl(luma, "luma")).toContain("lumalabs.ai");
  });

  it("rejects the audited placeholder assets", () => {
    expect(classifyPropertyMedia("https://my.matterport.com/show/?m=YWayaXpaJyH").kind).toBe("placeholder");
    expect(classifyPropertyMedia("https://lumalabs.ai/embed/b86b7928-f130-40a5-8cac-8095f30eed54").kind).toBe("placeholder");
  });

  it.each([
    "javascript:alert(1)",
    "http://my.matterport.com/show/?m=AbCdEf12345",
    "https://example.com/arbitrary-page",
    "not a url",
  ])("rejects unsupported or unsafe media: %s", (value) => {
    expect(classifyPropertyMedia(value).url).toBe("");
  });

  it("keeps images and videos in separate channels", () => {
    expect(imageMediaUrl("https://cdn.example.com/plan.webp")).toContain("plan.webp");
    expect(videoEmbedUrl("https://www.youtube.com/embed/Cn4G2lZ_g2I")).toContain("youtube.com/embed");
    expect(videoEmbedUrl("https://images.unsplash.com/photo-123")).toBe("");
  });

  it("allows only bounded image/PDF floor-plan attachments", () => {
    expect(safeFloorPlans([
      { url: "https://cdn.example.com/plan.pdf", type: "application/pdf", name: "Level 12" },
      { url: "javascript:alert(1)", type: "image/png", name: "bad" },
      { url: "https://cdn.example.com/file.exe", type: "application/octet-stream", name: "bad" },
    ])).toEqual([
      { url: "https://cdn.example.com/plan.pdf", type: "application/pdf", name: "Level 12" },
    ]);
  });
});
