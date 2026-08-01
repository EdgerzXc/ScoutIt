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
    const rawCity = request.headers.get("x-vercel-ip-city") || request.headers.get("cf-ipcity");
    const city = rawCity ? decodeURIComponent(rawCity) : "San Jose del Monte, Bulacan";
    const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "PH";
    const latStr = request.headers.get("x-vercel-ip-latitude");
    const lngStr = request.headers.get("x-vercel-ip-longitude");

    const latitude = latStr ? parseFloat(latStr) : 14.8135;
    const longitude = lngStr ? parseFloat(lngStr) : 121.0453;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Database client unavailable" }, { status: 500 });
    }

    async function safeInsertLog(payload) {
      const { error } = await supabaseAdmin.from("security_access_logs").insert(payload);
      if (error && (error.message?.includes("city") || error.message?.includes("column"))) {
        const { city: _c, country: _cn, latitude: _lat, longitude: _lng, ...base } = payload;
        await supabaseAdmin.from("security_access_logs").insert(base);
      }
    }

    async function safeUpdateLog(id, updatePayload) {
      const { error } = await supabaseAdmin.from("security_access_logs").update(updatePayload).eq("id", id);
      if (error && (error.message?.includes("city") || error.message?.includes("column"))) {
        const { city: _c, country: _cn, latitude: _lat, longitude: _lng, ...base } = updatePayload;
        await supabaseAdmin.from("security_access_logs").update(base).eq("id", id);
      }
    }

    // Handle Friction Point Telemetry
    if (eventType === "friction") {
      await safeInsertLog({
        masked_ip: deviceId,
        route_accessed: `FRICTION: ${body.frictionType || 'dropoff'} on ${path}`,
        request_count: 1,
        is_flagged: true,
        flag_reason: `User Friction: ${body.frictionType || 'abandoned'}`,
        city,
        country,
        latitude,
        longitude,
        last_request_at: new Date().toISOString()
      });
      return NextResponse.json({ success: true, eventType });
    }

    // Handle Search Intent Telemetry
    if (eventType === "search") {
      const searchTag = `SEARCH: ${body.searchQuery || body.searchCategory || 'all'} in ${body.searchLocation || city} (${body.matchCount} results)`;
      await safeInsertLog({
        masked_ip: deviceId,
        route_accessed: searchTag,
        request_count: 1,
        is_flagged: body.isZeroResult || false,
        flag_reason: body.isZeroResult ? "Zero Results Friction" : null,
        city,
        country,
        latitude,
        longitude,
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
      await safeUpdateLog(existing.id, {
        request_count: (existing.request_count || 1) + 1,
        city,
        country,
        latitude,
        longitude,
        last_request_at: new Date().toISOString()
      });
    } else {
      await safeInsertLog({
        masked_ip: deviceId,
        route_accessed: path,
        request_count: 1,
        is_flagged: false,
        city,
        country,
        latitude,
        longitude,
        last_request_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true, deviceId, deviceType });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
