import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("mock identities cannot authorize real mutations", () => {
  it.each([
    "src/app/api/admin/generate-seo/route.js",
    "src/app/api/ai/read-pdf/route.js",
    "src/app/api/intel/ingest/route.js",
    "src/app/api/deals/initiate/route.js",
  ])("%s has no body-based development bypass", (relativePath) => {
    const source = read(relativePath);
    expect(source).not.toContain("isDevMock");
    expect(source).not.toContain('formData.get("mockOwnerId")');
    expect(source).not.toContain("body.mockOwnerId");
  });

  it("requires staff authority for public SEO mutation", () => {
    expect(read("src/app/api/admin/generate-seo/route.js")).toContain("requireAdmin(request");
  });

  it("requires verified tokens for PDF and Intel ingest", () => {
    expect(read("src/app/api/ai/read-pdf/route.js")).toContain("auth.getUser(token)");
    expect(read("src/app/api/intel/ingest/route.js")).toContain("auth.getUser(token)");
  });

  it("requires a verified user and real Connect accounting for inquiry creation", () => {
    const source = read("src/app/api/deals/initiate/route.js");
    expect(source).toContain("const userId = await resolveUserId(request)");
    expect(source).toContain("spend_connects");
    expect(source).not.toContain("Bypass connect spend");
  });
});
