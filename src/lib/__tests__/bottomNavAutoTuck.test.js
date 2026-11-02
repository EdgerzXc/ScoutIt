import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("BottomNav Auto-Tuck Behavioral Contract", () => {
  const bottomNavSource = read("src/components/layout/BottomNav.js");

  it("initializes navigation as expanded for the first minute of discovery", () => {
    expect(bottomNavSource).toContain("const [isNavExpanded, setIsNavExpanded] = useState(true);");
  });

  it("implements a 60-second automatic tuck timer to tuck down into pulsating line", () => {
    expect(bottomNavSource).toMatch(/setTimeout\(\s*\(\)\s*=>\s*\{\s*setIsNavExpanded\(false\);\s*\}\s*,\s*60000\s*\)/);
  });

  it("renders pure pulsating golden handle line for intuitive affordance", () => {
    expect(bottomNavSource).toContain("animate-pulse");
    expect(bottomNavSource).toContain("bg-gold-accent");
    expect(bottomNavSource).not.toContain("Drag Up Quick Access");
  });
});
