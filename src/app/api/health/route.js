import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isEmailConfigured } from "@/lib/email";
import { getAirtableBudgetStatus } from "@/lib/airtableBudget";

const SUPABASE_PROBE_TIMEOUT_MS = 2_500;

function probeSupabaseTable(url, key, table, signal) {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, options) => fetch(input, { ...options, redirect: "error", cache: "no-store" }) },
  });
  return client.from(table)
    .select("id", { head: true })
    .limit(1)
    .retry(false)
    .abortSignal(signal);
}

async function probeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return "unconfigured";
  if (anonKey === serviceKey || anonKey.startsWith("sb_secret_")) return "unhealthy";

  try {
    const signal = AbortSignal.timeout(SUPABASE_PROBE_TIMEOUT_MS);
    const results = await Promise.all([
      probeSupabaseTable(url, anonKey, "properties", signal),
      probeSupabaseTable(url, serviceKey, "contact_messages", signal),
    ]);
    return results.every(({ error }) => !error) ? "healthy" : "unhealthy";
  } catch {
    return "unhealthy";
  }
}

export async function GET() {
  const [supabase, airtableBudget] = await Promise.all([probeSupabase(), getAirtableBudgetStatus()]);
  const airtable = process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_API_KEY ? "configured" : "unconfigured";
  let redis = "unconfigured";
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = airtableBudget.tracked ? "healthy" : "unhealthy";
  }

  return NextResponse.json({
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      api: "healthy",
      supabase,
      airtable,
      redis,
      email: isEmailConfigured() ? "configured" : "unconfigured",
    },
    airtableBudget,
  }, {
    status: supabase === "healthy" && airtable === "configured" && redis === "healthy" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
