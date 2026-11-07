import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { DEFAULT_LISTINGS_VALUE } from "@/context/ListingsContext";
import { DEFAULT_DEALS_VALUE } from "@/context/DealsContext";
import { DEFAULT_WALLET_VALUE } from "@/context/WalletContext";
import { DEFAULT_NOTIFICATIONS_VALUE } from "@/context/NotificationsContext";
import { DEFAULT_USER_VALUE } from "@/context/UserContext";

function walk(dir, filelist = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filepath = join(dir, file);
    const stat = statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git" && file !== "__tests__") {
        walk(filepath, filelist);
      }
    } else if ((file.endsWith(".js") || file.endsWith(".jsx")) && !file.endsWith(".test.js")) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

describe("Dashboard & Repository Hook Imports Contract (U-044 Permanent Guard)", () => {
  it("explicitly imports useCallback, useState, useEffect, and useRef in src/app/dashboard/page.js", () => {
    const dashboardCode = readFileSync(resolve(process.cwd(), "src/app/dashboard/page.js"), "utf8");
    const reactImport = dashboardCode.match(/import\s*\{([^}]+)\}\s*from\s*["']react["']/);
    expect(reactImport).not.toBeNull();
    const importedHooks = reactImport[1].split(",").map((s) => s.trim());
    expect(importedHooks).toContain("useCallback");
    expect(importedHooks).toContain("useState");
    expect(importedHooks).toContain("useEffect");
    expect(importedHooks).toContain("useRef");
  });

  it("ensures no source files in src/ invoke bare React hooks or APIs without importing them from 'react'", () => {
    const allSrcFiles = walk(resolve(process.cwd(), "src"));
    expect(allSrcFiles.length).toBeGreaterThan(700);

    const hooksAndApis = [
      "useState",
      "useEffect",
      "useCallback",
      "useMemo",
      "useRef",
      "useContext",
      "useReducer",
      "useId",
      "useTransition",
      "useLayoutEffect",
      "useSyncExternalStore",
      "useDeferredValue",
      "useImperativeHandle",
      "createContext",
      "createElement",
      "forwardRef",
      "memo",
    ];

    const violations = [];

    for (const f of allSrcFiles) {
      const raw = readFileSync(f, "utf8");
      const content = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
      for (const hook of hooksAndApis) {
        const bareHookRegex = new RegExp(`(?<![.\\w$])${hook}\\s*\\(`, "g");
        if (bareHookRegex.test(content)) {
          const hasImport =
            new RegExp(`import\\s+[^;]*\\b${hook}\\b[^;]*from\\s+['"]react['"]`, "s").test(content) ||
            new RegExp(`(?:const|let|var|function)\\s+[^=]*\\b${hook}\\b`).test(content);
          if (!hasImport) {
            violations.push(`${f} calls ${hook}() without importing it from 'react'`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("enforces 'no-undef': 'error' in eslint.config.mjs so unimported identifiers fail lint gates", () => {
    const eslintConfig = readFileSync(resolve(process.cwd(), "eslint.config.mjs"), "utf8");
    expect(eslintConfig).toMatch(/["']no-undef["']\s*:\s*["']error["']/);
  });

  it("guarantees every key destructured from useDashboard() or domain hooks across src/ exists in default context values", () => {
    const allSrcFiles = walk(resolve(process.cwd(), "src"));
    const compositeDefault = {
      ...DEFAULT_USER_VALUE,
      ...DEFAULT_WALLET_VALUE,
      ...DEFAULT_LISTINGS_VALUE,
      ...DEFAULT_DEALS_VALUE,
      ...DEFAULT_NOTIFICATIONS_VALUE,
    };
    const hookDefaults = {
      useDashboard: compositeDefault,
      useListings: DEFAULT_LISTINGS_VALUE,
      useDeals: DEFAULT_DEALS_VALUE,
      useWallet: DEFAULT_WALLET_VALUE,
      useNotifications: DEFAULT_NOTIFICATIONS_VALUE,
      useUser: DEFAULT_USER_VALUE,
    };

    const dashboardContextSrc = readFileSync(
      resolve(process.cwd(), "src/context/DashboardContext.js"),
      "utf8"
    );
    const defaultBlockMatch = dashboardContextSrc.match(
      /DEFAULT_CONTEXT_VALUE\s*=\s*\{([\s\S]*?)\};/
    );
    expect(defaultBlockMatch).not.toBeNull();
    const defaultBlock = defaultBlockMatch[1];

    const missingKeys = [];
    const regex = /const\s*\{([^}]+)\}\s*=\s*(useDashboard|useListings|useDeals|useWallet|useNotifications|useUser)\s*\(\)/g;

    for (const f of allSrcFiles) {
      const raw = readFileSync(f, "utf8");
      const content = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
      for (const match of content.matchAll(regex)) {
        const hookName = match[2];
        const targetDefault = hookDefaults[hookName];
        const keys = match[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.split(":")[0].split("=")[0].trim());

        for (const key of keys) {
          if (!(key in targetDefault) || targetDefault[key] === undefined) {
            missingKeys.push(`${f} destructures '${key}' from ${hookName}(), which is missing in domain default context`);
          }
          if (!new RegExp(`\\b${key}\\b`).test(defaultBlock)) {
            missingKeys.push(`${f} destructures '${key}' from ${hookName}(), which is missing in DEFAULT_CONTEXT_VALUE`);
          }
        }
      }
    }

    expect(missingKeys).toEqual([]);
  });
});
