import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Complete paid and secret token family blanked during offline runs (A-309).
 * Prevents offline test, dev, or build processes from inadvertently inheriting
 * live paid tokens (Mapbox, Gemini, Anthropic, Airtable, Redis) or privileged
 * administrative keys (Supabase service role, Cron secret).
 */
export const OFFLINE_BLANKED_ENV = Object.freeze({
  // Airtable Public CMS
  AIRTABLE_API_KEY: "",
  AIRTABLE_BASE_ID: "",

  // Upstash Redis Cache & Rate Limiting
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",

  // Mapbox Geocoding & Tile API Quota
  NEXT_PUBLIC_MAPBOX_TOKEN: "",
  MAPBOX_ACCESS_TOKEN: "",
  MAPBOX_SECRET_TOKEN: "",

  // Gemini & Anthropic Paid AI Quota
  GEMINI_API_KEY: "",
  GOOGLE_GENERATIVE_AI_API_KEY: "",
  ANTHROPIC_API_KEY: "",

  // Privileged Service Role Database Key
  SUPABASE_SERVICE_ROLE_KEY: "",

  // Platform Cron Authorization Secret
  CRON_SECRET: "",

  // Attribution & Wishlist Signing Secrets
  VIA_COOKIE_SECRET: "",
  WISHLIST_SHARE_SECRET: "",

  // Cloudflare Turnstile Verification Secret
  TURNSTILE_SECRET_KEY: "",

  // Decouple CMS to offline mock fixtures
  SCOUTIT_OFFLINE_CMS: "1",
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const command = process.argv[2];
  if (!["build", "dev", "start"].includes(command)) {
    console.error("Usage: node scripts/next-offline.mjs build|dev|start");
    process.exit(2);
  }

  const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
  const child = spawn(process.execPath, [nextCli, command, ...process.argv.slice(3)], {
    stdio: "inherit",
    env: {
      ...process.env,
      ...OFFLINE_BLANKED_ENV,
    },
  });

  child.on("error", (error) => {
    console.error("Offline Next.js command could not start:", error);
    process.exitCode = 1;
  });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
}
