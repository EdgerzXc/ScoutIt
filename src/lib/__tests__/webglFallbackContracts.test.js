import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { isWebglSupported } from "../webglCheck";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("WebGL Hardware Support Detection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when WebGL context creation succeeds", () => {
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        return {
          getContext: (contextType) => {
            if (contextType === "webgl" || contextType === "experimental-webgl") {
              return {
                getParameter: () => "WebGL 1.0",
              };
            }
            return null;
          },
        };
      }
      return origCreateElement(tag);
    });

    expect(isWebglSupported()).toBe(true);
  });

  it("returns false when WebGL context returns null (disabled or unsupported)", () => {
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        return {
          getContext: () => null,
        };
      }
      return origCreateElement(tag);
    });

    expect(isWebglSupported()).toBe(false);
  });

  it("returns false when canvas getContext throws an exception", () => {
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        return {
          getContext: () => {
            throw new Error("GPU process crashed");
          },
        };
      }
      return origCreateElement(tag);
    });

    expect(isWebglSupported()).toBe(false);
  });
});

describe("Granular Route Error Boundaries Contract", () => {
  const boundaries = [
    { path: "src/app/property/error.js", domain: "Property" },
    { path: "src/app/dashboard/error.js", domain: "Dashboard" },
    { path: "src/app/admin/error.js", domain: "Admin" },
    { path: "src/app/intel/error.js", domain: "Intel" },
    { path: "src/app/hubs/error.js", domain: "Hubs" },
  ];

  it("all route-level error boundaries exist with 'use client' and reset handler", () => {
    boundaries.forEach(({ path, domain }) => {
      expect(existsSync(resolve(process.cwd(), path)), `${domain} boundary file must exist`).toBe(true);
      const content = read(path);
      expect(content).toContain('"use client"');
      expect(content).toContain("export default function");
      expect(content).toContain("reset");
      expect(content).toContain("reportError");
    });
  });
});

describe("MapLibre 2D Fallback Component Contract", () => {
  it("MapFallback2D component file exists and exposes coordinate and external link fallback", () => {
    const path = "src/components/ui/MapFallback2D.js";
    expect(existsSync(resolve(process.cwd(), path))).toBe(true);
    const content = read(path);
    expect(content).toContain("export default function MapFallback2D");
    expect(content).toContain("google.com/maps");
    expect(content).toContain("3D WebGL acceleration is unavailable on this device");
  });

  it("all 10 map surfaces include isWebglSupported check and graceful degradation", () => {
    const surfaces = [
      "src/components/property/InteractiveRadiusMap.js",
      "src/components/property/FloodHeatmapMap.js",
      "src/components/property/SpatialCommandMap.js",
      "src/components/maps/SpatialCanvas.js",
      "src/components/transit/ManilaTransitMap.js",
      "src/components/intel/SpatialIntelMap.js",
      "src/components/dashboard/BrokerMode.js",
      "src/components/dashboard/BuyerMode.js",
      "src/components/descent/CityApproach.js",
      "src/components/property/InteractiveMap.js",
    ];

    surfaces.forEach((filePath) => {
      expect(existsSync(resolve(process.cwd(), filePath)), `${filePath} must exist`).toBe(true);
      const content = read(filePath);
      expect(content).toContain("isWebglSupported");
    });
  });
});
