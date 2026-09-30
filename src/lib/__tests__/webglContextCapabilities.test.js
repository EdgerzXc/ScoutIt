import { describe, expect, it } from "vitest";
import { hasShaderContext } from "@/lib/webglContextCapabilities";
import { createRenderer } from "@/components/descent/blackHoleEngine";

describe("optional black-hole WebGL", () => {
  it("rejects a truthy context that lacks shader compilation", () => {
    const incomplete = { createShader: () => ({}) };
    expect(hasShaderContext(incomplete)).toBe(false);
    expect(createRenderer({ getContext: () => incomplete }, { getParams: () => ({}) })).toBeNull();
  });

  it("falls back when context creation throws", () => {
    expect(createRenderer({ getContext: () => { throw new Error("blocked"); } }, {
      getParams: () => ({}),
    })).toBeNull();
  });

  it("accepts complete shader APIs and rejects throwing shims", () => {
    const complete = new Proxy({}, { get: () => () => {} });
    const throwing = new Proxy({}, { get: () => { throw new Error("injected shim"); } });
    expect(hasShaderContext(complete)).toBe(true);
    expect(hasShaderContext(throwing)).toBe(false);
  });
});
