import { describe, it, expect } from "vitest";
import { generateQrMatrix, generateQrSvg } from "../qrCodeGenerator";

describe("qrCodeGenerator", () => {
  it("generates a valid QR matrix for a URL", () => {
    const url = "https://www.scoutit.space/property/cyber-sigma-tower-3";
    const res = generateQrMatrix(url);
    expect(res).toBeDefined();
    expect(res.size).toBeGreaterThanOrEqual(21);
    expect(res.modules).toHaveLength(res.size);
    expect(res.modules[0]).toHaveLength(res.size);

    // Top-left finder pattern corner module (0,0) must be true (dark)
    expect(res.modules[0][0]).toBe(true);
    // Top-right finder pattern corner module (0, size - 1) must be true (dark)
    expect(res.modules[0][res.size - 1]).toBe(true);
    // Bottom-left finder pattern corner module (size - 1, 0) must be true (dark)
    expect(res.modules[res.size - 1][0]).toBe(true);
  });

  it("generates an SVG string representation with custom colors and padding", () => {
    const url = "https://www.scoutit.space/property/test";
    const svg = generateQrSvg(url, { color: "#E8AE3C", background: "#121212", padding: 2 });
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('fill="#121212"');
    expect(svg).toContain('fill="#E8AE3C"');
    expect(svg).toContain("<rect");
  });

  it("handles short and long strings gracefully", () => {
    const shortRes = generateQrMatrix("https://scoutit.space");
    expect(shortRes.size).toBeGreaterThanOrEqual(21);

    const longUrl = "https://www.scoutit.space/property/luxury-penthouse-bgc-taguig-very-long-canonical-slug-with-many-attributes";
    const longRes = generateQrMatrix(longUrl);
    expect(longRes.size).toBeGreaterThan(21);
  });
});
