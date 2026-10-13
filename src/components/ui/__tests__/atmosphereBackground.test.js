import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join(" ");
}

const SOURCE = codeWithoutComments("src/components/ui/AtmosphereBackground.js");
const CSS_SOURCE = readFileSync("src/app/globals.css", "utf8");

describe("AtmosphereBackground Layer 5 Role Atmosphere", () => {
  it("includes all primary role variants in VARIANT_GLOW", () => {
    expect(SOURCE).toContain("broker:");
    expect(SOURCE).toContain("buyer:");
    expect(SOURCE).toContain("owner:");
    expect(SOURCE).toContain("operator:");
    expect(SOURCE).toContain("provider:");
  });

  it("renders the base atmosphere background element unconditionally", () => {
    expect(SOURCE).toContain('className="atmosphere-bg"');
    expect(SOURCE).toContain('aria-hidden="true"');
  });

  it("renders role-specific atmospheric layer for broker", () => {
    expect(SOURCE).toContain('variant === "broker"');
    expect(SOURCE).toContain('className="atmosphere-broker"');
  });

  it("renders role-specific atmospheric layer for buyer and exploring modes", () => {
    expect(SOURCE).toContain('variant === "buyer" || variant === "exploring"');
    expect(SOURCE).toContain('className="atmosphere-buyer"');
  });

  it("renders role-specific atmospheric layer for owner", () => {
    expect(SOURCE).toContain('variant === "owner"');
    expect(SOURCE).toContain('className="atmosphere-owner"');
  });

  it("renders role-specific atmospheric layer for operator and provider", () => {
    expect(SOURCE).toContain('variant === "operator" || variant === "provider"');
    expect(SOURCE).toContain('className="atmosphere-operator"');
  });
});

describe("globals.css Role Atmosphere CSS Contracts", () => {
  it("defines .atmosphere-broker, .atmosphere-buyer, .atmosphere-owner, and .atmosphere-operator", () => {
    expect(CSS_SOURCE).toContain(".atmosphere-broker");
    expect(CSS_SOURCE).toContain(".atmosphere-buyer");
    expect(CSS_SOURCE).toContain(".atmosphere-owner");
    expect(CSS_SOURCE).toContain(".atmosphere-operator");
  });

  it("disables decorative atmosphere in lite-mode", () => {
    expect(CSS_SOURCE).toContain("html.lite-mode .atmosphere-buyer");
    expect(CSS_SOURCE).toContain("html.lite-mode .atmosphere-owner");
    expect(CSS_SOURCE).toContain("html.lite-mode .atmosphere-operator");
  });

  it("disables animations when prefers-reduced-motion is active", () => {
    expect(CSS_SOURCE).toContain("@media (prefers-reduced-motion: reduce)");
    expect(CSS_SOURCE).toContain(".atmosphere-buyer::before");
    expect(CSS_SOURCE).toContain(".atmosphere-owner::after");
  });
});
