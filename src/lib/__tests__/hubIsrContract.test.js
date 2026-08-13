import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CMS_REDIS_FETCH_CACHE } from "@/lib/cmsCache";

describe("hub ISR contract", () => {
  it("keeps the public hub page on one-hour ISR without a no-store Redis fetch", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/hubs/[slug]/page.js"),
      "utf8"
    );

    expect(page).toMatch(/export const revalidate = 3600;/);
    expect(CMS_REDIS_FETCH_CACHE).toBe("default");
  });
});
