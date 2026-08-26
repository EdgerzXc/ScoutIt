import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const collectPages = (relativeDir) => {
  const absolute = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) return collectPages(next);
    return entry.name === "page.js" ? [next] : [];
  });
};

describe("private workspace boundary (A-025)", () => {
  const privatePages = [
    ...collectPages("src/app/dashboard"),
    ...collectPages("src/app/admin"),
  ];

  it("finds the private workspace pages it is meant to protect", () => {
    expect(privatePages.length).toBeGreaterThan(5);
  });

  it.each(privatePages)("wraps %s in VerifiedWorkspaceBoundary", (page) => {
    const source = fs.readFileSync(path.join(ROOT, page), "utf8");
    expect(source).toContain("VerifiedWorkspaceBoundary");
    expect(source).toContain("<VerifiedWorkspaceBoundary>");
  });

  it("resolves identity before the provider requests private data", () => {
    const context = fs.readFileSync(path.join(ROOT, "src/context/DashboardContext.js"), "utf8");
    expect(context).toContain("if (!identityResolved) return;");
    expect(context).toContain("if (!currentUser?.id) {");
    expect(context).toContain("[identityResolved, currentUser?.id]");
  });

  it("carries the blocked destination into onboarding", () => {
    const boundary = fs.readFileSync(path.join(ROOT, "src/components/auth/VerifiedWorkspaceBoundary.js"), "utf8");
    expect(boundary).toContain("/onboarding?next=");
    expect(boundary).toContain("encodeURIComponent(returnPath)");
    const onboarding = fs.readFileSync(path.join(ROOT, "src/app/onboarding/page.js"), "utf8");
    expect(onboarding).toContain("normalizePrivateReturnPath");
    expect(onboarding).not.toContain('router.replace("/dashboard")');
  });
});
