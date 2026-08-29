import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Orbit heading hierarchy", () => {
  it("gives the standalone Orbit route its page h1 while keeping embedded Descent content subordinate", () => {
    const podium = read("src/components/board/BoardPodium.js");
    const orbit = read("src/app/layer/orbit/page.js");
    const descent = read("src/app/descent/page.js");

    expect(podium).toContain("headingLevel = 2");
    expect(podium).toContain('const HeroHeading = headingLevel === 1 ? "h1" : "h2"');
    expect(podium).toContain('<HeroHeading className="orbit-hero-title">');
    expect(orbit).toContain("<BoardPodium headingLevel={1} />");
    expect(descent).toContain("<BoardPodium />");
  });
});
