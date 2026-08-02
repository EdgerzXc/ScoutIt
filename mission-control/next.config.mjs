import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This repository intentionally contains two lockfiles because Mission
  // Control is a separate deployable app. Pin its Turbopack boundary so Next
  // does not infer the parent ScoutIt app as its workspace root.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
