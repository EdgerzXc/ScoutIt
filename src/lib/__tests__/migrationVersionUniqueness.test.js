import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Database Migration Version Uniqueness and O-004 Readiness (A-308)", () => {
  it("guarantees every migration in supabase/migrations has a strictly unique version timestamp", () => {
    const migrationsDir = join(process.cwd(), "supabase", "migrations");
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

    expect(files.length).toBeGreaterThan(20);

    const versionMap = new Map();
    const duplicates = [];

    for (const file of files) {
      const match = file.match(/^(\d+)_/);
      expect(match).not.toBeNull();
      const version = match[1];

      if (versionMap.has(version)) {
        duplicates.push({ version, existing: versionMap.get(version), current: file });
      } else {
        versionMap.set(version, file);
      }
    }

    expect(duplicates).toEqual([]);
    expect(versionMap.size).toBe(files.length);
  });

  it("pins 20260802000003 uniquely to connects_wallet_and_tiers and 20260802000007 to property_lifecycle_safety_guards", () => {
    const migrationsDir = join(process.cwd(), "supabase", "migrations");
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

    const v03 = files.find((f) => f.startsWith("20260802000003_"));
    const v07 = files.find((f) => f.startsWith("20260802000007_"));

    expect(v03).toBe("20260802000003_connects_wallet_and_tiers.sql");
    expect(v07).toBe("20260802000007_property_lifecycle_safety_guards.sql");
  });
});
