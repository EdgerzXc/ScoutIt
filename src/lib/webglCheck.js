import { useState, useEffect } from "react";

/**
 * Checks whether WebGL is supported by the current browser/device.
 * Evaluates both standard WebGL and experimental-webgl contexts safely.
 * Returns true during SSR to avoid hydration mismatch.
 */
export function isWebglSupported() {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
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
