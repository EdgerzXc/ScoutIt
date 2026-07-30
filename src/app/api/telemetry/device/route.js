import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const deviceId = body.deviceId || "dev_anon";
    const deviceType = body.deviceType || "desktop";
    const path = body.path || "/";
    const eventType = body.eventType || "pageview";

    // Extract geo metadata from request headers
    const city = request.headers.get("x-vercel-ip-city") || request.headers.get("cf-ipcity") || "San Jose del Monte, Bulacan";
    const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "PH";
    const latStr = request.headers.get("x-vercel-ip-latitude");
    const lngStr = request.headers.get("x-vercel-ip-longitude");

    const latitude = latStr ? parseFloat(latStr) : 14.8135;
    const longitude = lngStr ? parseFloat(lngStr) : 121.0453;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Database client unavailable" }, { status: 500 });
    }

    // Handle Friction Point Telemetry
    if (eventType === "friction") {
      await supabaseAdmin.from("security_access_logs").insert({
        masked_ip: deviceId,
        route_accessed: `FRICTION: ${body.frictionType || 'dropoff'} on ${path}`,
        request_count: 1,
        is_flagged: true,
        flag_reason: `User Friction: ${body.frictionType || 'abandoned'}`,
        last_request_at: new Date().toISOString()
      });
      return NextResponse.json({ success: true, eventType });
    }

    // Handle Search Intent Telemetry
    if (eventType === "search") {
      const searchTag = `SEARCH: ${body.searchQuery || body.searchCategory || 'all'} in ${body.searchLocation || city} (${body.matchCount} results)`;
      await supabaseAdmin.from("security_access_logs").insert({
        masked_ip: deviceId,
        route_accessed: searchTag,
        request_count: 1,
        is_flagged: body.isZeroResult || false,
        flag_reason: body.isZeroResult ? "Zero Results Friction" : null,
        last_request_at: new Date().toISOString()
      });
      return NextResponse.json({ success: true, eventType });
    }

    // Standard Pageview / Access Log
    const { data: existing } = await supabaseAdmin
      .from("security_access_logs")
      .select("id, request_count")
      .eq("masked_ip", deviceId)
      .eq("route_accessed", path)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("security_access_logs")
        .update({
          request_count: (existing.request_count || 1) + 1,
          last_request_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("security_access_logs").insert({
        masked_ip: deviceId,
        route_accessed: path,
        request_count: 1,
        is_flagged: false,
        last_request_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, deviceId, deviceType });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
