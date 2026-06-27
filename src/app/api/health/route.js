import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';

// Throttled to 12 requests per minute (e.g. 1 check every 5 seconds) to prevent probing DoS
const limiter = rateLimit({
  interval: 60 * 1000, 
  uniqueTokenPerInterval: 100,
});

export async function GET(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    await limiter.check(12, ip);
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Too many health check requests" }, { status: 429 });
  }

  const results = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      api: "healthy",
      supabase: "unknown",
      airtable: "unknown"
    }
  };

  try {
    // Check Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('properties').select('id').limit(1);
      results.services.supabase = error ? "unhealthy" : "healthy";
    } else {
      results.services.supabase = "unconfigured";
    }

    // Check Airtable connection
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableKey = process.env.AIRTABLE_API_KEY;
    if (airtableBaseId && airtableKey) {
      const atRes = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/Properties?maxRecords=1`, {
        headers: { Authorization: `Bearer ${airtableKey}` }
      });
      results.services.airtable = atRes.ok ? "healthy" : "unhealthy";
    } else {
      results.services.airtable = "unconfigured";
    }

    const allHealthy = Object.values(results.services).every(status => status === 'healthy' || status === 'unconfigured');
    
    return NextResponse.json(results, { status: allHealthy ? 200 : 503 });

  } catch (error) {
    console.error("[Health Check] Probe failed", error);
    results.status = "error";
    results.message = error.message;
    return NextResponse.json(results, { status: 500 });
  }
}
