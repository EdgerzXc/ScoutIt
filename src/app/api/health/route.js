import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isEmailConfigured } from "@/lib/email";
import { getAirtableBudgetStatus } from "@/lib/airtableBudget";

const SUPABASE_PROBE_TIMEOUT_MS = 2_500;

async function probeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) return "unconfigured";

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await supabase.from("properties")
      .select("id", { head: true })
      .limit(1)
      .retry(false)
      .abortSignal(AbortSignal.timeout(SUPABASE_PROBE_TIMEOUT_MS));
    return error ? "unhealthy" : "healthy";
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
