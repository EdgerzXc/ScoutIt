const SHADER_CONTEXT_METHODS = [
  "createShader", "shaderSource", "compileShader", "getShaderParameter",
  "getShaderInfoLog", "createProgram", "attachShader", "linkProgram",
  "getProgramParameter", "getProgramInfoLog", "useProgram", "createBuffer",
  "bindBuffer", "bufferData", "getAttribLocation", "enableVertexAttribArray",
  "vertexAttribPointer", "getUniformLocation", "uniform1f", "uniform2f",
  "viewport", "clearColor", "clear", "drawArrays", "deleteProgram",
  "deleteShader", "deleteBuffer",
];

// Some browsers or injected WebGL shims return a truthy context that lacks
// shader methods. The decorative hero should use its CSS fallback in that case.
export function hasShaderContext(gl) {
  try {
    return Boolean(gl) && SHADER_CONTEXT_METHODS.every((name) => typeof gl[name] === "function");
  } catch {
    return false;
  }
}
