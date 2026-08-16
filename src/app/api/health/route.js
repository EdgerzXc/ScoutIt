import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeError } from '@/lib/sanitizeError';
import { isEmailConfigured } from '@/lib/email';

// A service that is present but optional must not fail the rollup. Supabase and
// Airtable already used "unconfigured" for this; "configured" is its counterpart
// for a credential whose presence is all we assert.
const NON_FAILING_STATUSES = new Set(['healthy', 'configured', 'unconfigured']);

export async function GET(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Error" }, { status: 500 });
  }

  const results = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      api: "healthy",
      supabase: "unknown",
      airtable: "unknown",
      email: "unknown"
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

    // Check Airtable connection — probe the real CMS table. This previously
    // hit a nonexistent "Properties" table, so health reported Airtable as
    // unhealthy (and the endpoint 503'd) even while /api/cms was serving
    // Airtable data fine.
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableKey = process.env.AIRTABLE_API_KEY;
    if (airtableBaseId && airtableKey) {
      const atRes = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/PROPERTIES_CMS?maxRecords=1`, {
        headers: { Authorization: `Bearer ${airtableKey}` }
      });
      results.services.airtable = atRes.ok ? "healthy" : "unhealthy";
    } else {
      results.services.airtable = "unconfigured";
    }

    // Email reports PRESENCE, not reachability, and says so by using a
    // different word than the probed services above. Verifying it for real
    // means sending a message, which a public endpoint must never do on
    // request — so "configured" is the strongest honest claim here, and
    // deliberately not "healthy" (Standing Rule 1: state the behaviour you
    // actually guarantee).
    //
    // This exists because RESEND_API_KEY was the one production credential with
    // no outward symptom: confirming it required either dashboard access or
    // sending mail, so it sat unverified in the owner queue. Presence is cheap,
    // safe to expose, and answers the question that was actually being asked.
    // A near-miss variable name now shows up here as "unconfigured" instead of
    // failing silently at the moment someone was waiting for a notification.
    results.services.email = isEmailConfigured() ? "configured" : "unconfigured";

    const allHealthy = Object.values(results.services).every(status => NON_FAILING_STATUSES.has(status));

    return NextResponse.json(results, { status: allHealthy ? 200 : 503 });

  } catch (error) {
    console.error("[Health Check] Probe failed", error);
    results.status = "error";
    // /api/health is publicly reachable — never echo the raw probe error,
    // it names our Airtable base and Supabase host.
    results.message = sanitizeError(error, "Health probe failed.");
    return NextResponse.json(results, { status: 500 });
  }
}
