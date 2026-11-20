import { createHash } from "node:crypto";

export function publicCatalogueCacheKey(key) {
  const target = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV;
  if (!target || target === "production" || target === "development") return key;

  const airtableBase = process.env.AIRTABLE_BASE_ID?.trim() || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "") || "";
  const scope = createHash("sha256").update(JSON.stringify([target, airtableBase, supabaseUrl])).digest("base64url");
  return `scoutit:catalogue:${scope}:${key}`;
}
