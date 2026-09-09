import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  GOLDEN_DEFAULT_PARAMS,
  GOLDEN_PALETTE_NAMES,
  GOLDEN_PRESETS,
  FRAGMENT_SHADER_SRC,
  VERTEX_SHADER_SRC,
  createRenderer,
} from "@/components/descent/blackHoleEngine.js";

// A-088 Phase 0 — the engine extraction changed no behaviour. Render tests
// are impossible in this repo (Vite/Rolldown will not parse JSX in .js), so
// this contract asserts the split itself by reading source, the same pattern
// A-016 established: the engine owns GL, the consumer owns React, presets
// resolve from exactly one definition.

const enginePath = join(process.cwd(), "src/components/descent/blackHoleEngine.js");
const canvasPath = join(process.cwd(), "src/components/descent/GoldenHorizonCanvas.js");

describe("blackHoleEngine phase-zero contract", () => {
  it("engine exports the renderer, shaders, and the single preset definition", () => {
    expect(typeof createRenderer).toBe("function");
    expect(VERTEX_SHADER_SRC).toContain("gl_Position");
    expect(FRAGMENT_SHADER_SRC).toContain("gl_FragColor");
    expect(FRAGMENT_SHADER_SRC).toContain("u_lensing");
    expect(GOLDEN_PRESETS).toHaveLength(5);
    expect(GOLDEN_DEFAULT_PARAMS).toBe(GOLDEN_PRESETS[0].params);
    expect(GOLDEN_PALETTE_NAMES).toHaveLength(5);
  });

  it("engine imports no React and no repo modules (framework-free)", () => {
    const src = readFileSync(enginePath, "utf8");
    expect(src).not.toMatch(/from\s+["']react["']/);
    expect(src).not.toMatch(/from\s+["']@\//);
    expect(src).not.toMatch(/useEffect|useRef|useState/);
  });

  it("engine keeps every guard the consumer relied on", () => {
    const src = readFileSync(enginePath, "utf8");
    for (const guard of [
      "prefers-reduced-motion",
      "IntersectionObserver",
      "visibilitychange",
      "liteModeEvent",
      "preserveDrawingBuffer",
      "deleteProgram",
      "deleteBuffer",
    ]) {
      expect(src).toContain(guard);
    }
    // Cleanup deletes resources but never force-loses the context: Strict
    // Mode's dev double-mount reuses the canvas.
    expect(src).not.toContain("loseContext");
  });

  it("consumer owns no GL: no context, compile, or shader source remains", () => {
    const src = readFileSync(canvasPath, "utf8");
    expect(src).not.toContain("getContext(");
    expect(src).not.toContain("compileShader");
    expect(src).not.toContain("SHADER_SRC");
    expect(src).not.toContain("gl_Position");
    expect(src).not.toContain("for (int i = 0; i < 110;");
  });

  it("consumer keeps the easter egg's preserveDrawingBuffer opt-in", () => {
    const src = readFileSync(canvasPath, "utf8");
    expect(src).toContain("preserveDrawingBuffer: true");
  });

  it("consumer re-exports presets from the engine (InteractivePanel moves nothing)", () => {
    const src = readFileSync(canvasPath, "utf8");
    expect(src).toContain('from "./blackHoleEngine"');
    expect(src).toContain("GOLDEN_DEFAULT_PARAMS, GOLDEN_PALETTE_NAMES, GOLDEN_PRESETS");
    const panel = readFileSync(
      join(process.cwd(), "src/components/descent/InteractivePanel.js"),
      "utf8",
    );
    expect(panel).toContain('from "./GoldenHorizonCanvas"');
  });

  it("consumer attaches the same listeners with the same speed scales", () => {
    const src = readFileSync(canvasPath, "utf8");
    for (const token of [
      '"mousedown"',
      '"mousemove"',
      '"mouseup"',
      '"mouseleave"',
      '"touchstart"',
      '"touchmove"',
      '"touchend"',
      "0.005",
      "0.008",
      "renderer.destroy()",
    ]) {
      expect(src).toContain(token);
    }
  });
});
