import { useState, useEffect } from "react";

/**
 * Checks for WebGL2, required by MapLibre 6, on the current browser/device.
 * Returns true during SSR to avoid hydration mismatch.
 */
export function isWebglSupported() {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    return Boolean(gl && typeof gl.getParameter === "function");
  } catch {
    return false;
  }
}

/**
 * React hook that returns boolean state indicating whether WebGL is active.
 * Defaults to true on mount, verified client-side in useEffect.
 */
export function useWebglCheck() {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isWebglSupported());
  }, []);

  return supported;
}
