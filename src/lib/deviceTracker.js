"use client";

const DEVICE_ID_KEY = "scout_did";

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null;

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      const cryptoUuid = typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      deviceId = `dev_${cryptoUuid.replace(/-/g, "").substring(0, 16)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      document.cookie = `${DEVICE_ID_KEY}=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return deviceId;
  } catch (err) {
    return `dev_anon_${Math.random().toString(36).substring(2, 10)}`;
  }
}

export function detectDeviceType() {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|android|touch/i.test(ua)) return "mobile";
  return "desktop";
}

export async function pingDeviceTelemetry(extraData = {}) {
  if (typeof window === "undefined") return;

  try {
    const deviceType = detectDeviceType();

    fetch("/api/telemetry/device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: extraData.eventType || "pageview",
        deviceType,
        path: window.location.pathname,
        ...extraData
      }),
      keepalive: true
    }).catch(() => {});
  } catch (err) {
    // Fail safe
  }
}

export function trackSearchIntent(_query, category, _location, _minPrice, _maxPrice, matchCount = 0) {
  const allowedCategories = new Set([
    "commercial", "residential", "industrial", "land", "office",
    "retail", "warehouse", "hospitality", "mixed_use",
  ]);
  const normalizedCategory = String(category || "").toLowerCase().replace(/[ -]+/g, "_");
  pingDeviceTelemetry({
    eventType: "search",
    searchCategory: allowedCategories.has(normalizedCategory) ? normalizedCategory : "all",
    matchCount: Number.isInteger(matchCount) && matchCount >= 0 ? Math.min(matchCount, 100000) : 0,
  });
}

export function trackFrictionPoint(frictionType, _details = {}) {
  const allowed = new Set(["abandoned_inquiry_modal", "zero_search_results", "slow_page"]);
  if (!allowed.has(frictionType)) return;
  pingDeviceTelemetry({ eventType: "friction", frictionType });
}
