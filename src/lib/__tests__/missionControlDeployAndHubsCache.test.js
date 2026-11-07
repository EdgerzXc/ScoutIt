import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { GET as hubsGet, revalidate as hubsRevalidate } from "@/app/api/hubs/route";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("A-329: Mission Control Deploy Environment Parity, Automated Scan Cron & Hubs Edge Caching", () => {
  it("mission-control/.env.example thoroughly documents required environment variables", () => {
    const envExample = read("mission-control/.env.example");

    const requiredKeys = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "AIRTABLE_API_KEY",
      "AIRTABLE_BASE_ID",
      "CRON_SECRET",
      "NEXT_PUBLIC_APP_URL",
    ];

    for (const key of requiredKeys) {
      expect(envExample).toContain(`${key}=`);
    }
  });

  it("mission-control/vercel.json defines a Hobby-compatible daily cron schedule for /api/scan/process", () => {
    expect(existsSync("mission-control/vercel.json")).toBe(true);
    const vercelConfig = JSON.parse(read("mission-control/vercel.json"));
    expect(Array.isArray(vercelConfig.crons)).toBe(true);
    const scanCron = vercelConfig.crons.find((c) => c.path === "/api/scan/process");
    expect(scanCron).toBeDefined();
    expect(scanCron.schedule).toBe("0 6 * * *");
  });

  it("enforces Vercel Hobby daily-or-less-frequent cron expressions across all vercel.json files", () => {
    // Vercel Hobby accounts reject any cron expression that runs more than once per day
    // (minute and hour fields must be fixed single integers 0-59 and 0-23, never *, */n, ranges, or lists).
    const hobbyDailyOrLessRegex = /^([0-9]|[1-5][0-9])\s+([0-9]|1[0-9]|2[0-3])\s+(\*|[1-9]|[12][0-9]|3[01])\s+(\*|[1-9]|1[0-2])\s+(\*|[0-7])$/;

    for (const configPath of ["vercel.json", "mission-control/vercel.json"]) {
      const config = JSON.parse(read(configPath));
      for (const cron of config.crons || []) {
        expect(
          hobbyDailyOrLessRegex.test(cron.schedule.trim()),
          `${configPath} cron ${cron.path} has sub-daily schedule "${cron.schedule}" which fails Vercel Hobby builds`
        ).toBe(true);
      }
    }
  });

  it("mission-control /api/scan/process route exports both POST and GET handlers", () => {
    const scanRouteSrc = read("mission-control/src/app/api/scan/process/route.js");
    expect(scanRouteSrc).toContain("export async function POST(request)");
    expect(scanRouteSrc).toContain("export async function GET(request)");
    expect(scanRouteSrc).toContain("return POST(request);");
  });

  it("src/app/api/hubs/route.js exports 24h revalidate and returns public Cache-Control headers", async () => {
    expect(hubsRevalidate).toBe(86400);

    const res = await hubsGet();
    expect(res.status).toBe(200);

    const cacheHeader = res.headers.get("Cache-Control");
    expect(cacheHeader).toContain("public");
    expect(cacheHeader).toContain("s-maxage=86400");
    expect(cacheHeader).toContain("stale-while-revalidate=604800");

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.hubs)).toBe(true);
    expect(json.count).toBeGreaterThan(0);
  });
});
