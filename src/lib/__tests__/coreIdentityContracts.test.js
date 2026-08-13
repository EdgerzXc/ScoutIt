import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("Core identity trust boundaries", () => {
  const publicEntryPoints = [
    "src/app/layer/core/page.js",
    "src/app/about-you/page.js",
  ];
  const publicExperiences = [
    "src/components/descent/CoreGateway.js",
    "src/components/descent/AboutYouExperience.js",
  ];

  it("routes both public pages through the shared verified-identity boundary", () => {
    expect(read(publicEntryPoints[0])).toContain("CoreGateway");
    expect(read(publicEntryPoints[1])).toContain("AboutYouExperience");

    for (const file of publicExperiences) {
      const source = read(file);
      expect(source).toContain("useVerifiedIdentity()");
      expect(source).not.toContain('localStorage.getItem("scoutit_user")');
      expect(source).not.toContain("currentUser");
    }

    const hook = read("src/components/descent/useVerifiedIdentity.js");
    expect(hook).toContain("getUser()");
    expect(hook).toContain("onAuthStateChange(");
    expect(hook).not.toContain("getSession()");
    expect(hook).not.toContain("scoutit_user");
  });

  it("does not present invented activity metrics or unsupported verification", () => {
    const publicCore = [...publicExperiences, "src/components/descent/coreAccountPresentation.js"].map(read).join("\n");
    for (const inventedMetric of ['"142"', '"07"', '"03"', '"12"']) {
      expect(publicCore).not.toContain(inventedMetric);
    }
    expect(publicCore).not.toContain(" · Verified");
    expect(publicCore).toContain("No counts are guessed");
    expect(publicCore).toContain("Open live dashboard");
  });
});
