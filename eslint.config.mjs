import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "mission-control/.next/**",
    "mission-control/node_modules/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "_SCOUTIT_BRAIN/**",
    "_REVIEW_QUEUE/**",
    "manifesto-lab/**",
    "hero-page-property-spheres/**",
    "council-of-high-intelligence/**",
    "awesome-legal-skills-temp/**",
    "awesome-llm-apps/**",
    "e2e_tests/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
