import { describe, it, expect } from "vitest";
import { OFFLINE_BLANKED_ENV } from "../../../scripts/next-offline.mjs";

describe("A-309: Offline Environment Secret & Paid Token Isolation", () => {
  it("blanks the complete paid token family to prevent offline quota spending", () => {
    // Mapbox
    expect(OFFLINE_BLANKED_ENV.NEXT_PUBLIC_MAPBOX_TOKEN).toBe("");
    expect(OFFLINE_BLANKED_ENV.MAPBOX_ACCESS_TOKEN).toBe("");
    expect(OFFLINE_BLANKED_ENV.MAPBOX_SECRET_TOKEN).toBe("");

    // Airtable
    expect(OFFLINE_BLANKED_ENV.AIRTABLE_API_KEY).toBe("");
    expect(OFFLINE_BLANKED_ENV.AIRTABLE_BASE_ID).toBe("");

    // Redis
    expect(OFFLINE_BLANKED_ENV.UPSTASH_REDIS_REST_URL).toBe("");
    expect(OFFLINE_BLANKED_ENV.UPSTASH_REDIS_REST_TOKEN).toBe("");

    // Gemini & Anthropic LLMs
    expect(OFFLINE_BLANKED_ENV.GEMINI_API_KEY).toBe("");
    expect(OFFLINE_BLANKED_ENV.GOOGLE_GENERATIVE_AI_API_KEY).toBe("");
    expect(OFFLINE_BLANKED_ENV.ANTHROPIC_API_KEY).toBe("");
  });

  it("blanks privileged service role keys and webhook/cron secrets", () => {
    expect(OFFLINE_BLANKED_ENV.SUPABASE_SERVICE_ROLE_KEY).toBe("");
    expect(OFFLINE_BLANKED_ENV.CRON_SECRET).toBe("");
    expect(OFFLINE_BLANKED_ENV.TURNSTILE_SECRET_KEY).toBe("");
    expect(OFFLINE_BLANKED_ENV.VIA_COOKIE_SECRET).toBe("");
    expect(OFFLINE_BLANKED_ENV.WISHLIST_SHARE_SECRET).toBe("");
  });

  it("sets SCOUTIT_OFFLINE_CMS to 1 to enforce offline fixtures", () => {
    expect(OFFLINE_BLANKED_ENV.SCOUTIT_OFFLINE_CMS).toBe("1");
  });

  it("overrides simulated parent process environment containing live tokens", () => {
    const liveParentEnv = {
      AIRTABLE_API_KEY: "pat_live_12345",
      NEXT_PUBLIC_MAPBOX_TOKEN: "pk.live_token",
      GEMINI_API_KEY: "AIzaSyLiveSecret",
      SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOi...service-role",
      CRON_SECRET: "cron_secret_live",
      OTHER_VAR: "preserved_config",
    };

    const combinedEnv = {
      ...liveParentEnv,
      ...OFFLINE_BLANKED_ENV,
    };

    expect(combinedEnv.AIRTABLE_API_KEY).toBe("");
    expect(combinedEnv.NEXT_PUBLIC_MAPBOX_TOKEN).toBe("");
    expect(combinedEnv.GEMINI_API_KEY).toBe("");
    expect(combinedEnv.SUPABASE_SERVICE_ROLE_KEY).toBe("");
    expect(combinedEnv.CRON_SECRET).toBe("");
    expect(combinedEnv.OTHER_VAR).toBe("preserved_config");
  });
});
