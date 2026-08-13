"use client";

import { useEffect, useMemo, useState } from "react";

const CACHE_KEY = "scoutit_ambient_v2";
const WEATHER_TTL = 15 * 60 * 1000;
const AIR_TTL = 25 * 60 * 1000;

export function weatherCondition(code) {
  if (code === 0) return "CLEAR";
  if (code === 1 || code === 2) return "PARTLY CLOUDY";
  if (code === 3) return "OVERCAST";
  if (code >= 45 && code <= 48) return "FOG";
  if (code >= 51 && code <= 57) return "DRIZZLE";
  if (code >= 61 && code <= 67) return "RAIN";
  if (code >= 71 && code <= 77) return "SNOW";
  if (code >= 80 && code <= 82) return "SHOWERS";
  if (code >= 85 && code <= 86) return "SNOW SHOWERS";
  if (code >= 95 && code <= 99) return "THUNDERSTORM";
  return null;
}

// Open-Meteo returns US AQI, so use the matching US EPA category names.
export function airQualityLabel(aqi) {
  if (!Number.isFinite(aqi) || aqi < 0) return null;
  if (aqi <= 50) return "GOOD";
  if (aqi <= 100) return "MODERATE";
  if (aqi <= 150) return "SENSITIVE GROUPS";
  if (aqi <= 200) return "UNHEALTHY";
  if (aqi <= 300) return "VERY UNHEALTHY";
  return "HAZARDOUS";
}

export function greetingForHour(hour) {
  if (hour >= 5 && hour < 12) return "GOOD MORNING";
  if (hour >= 12 && hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export function formatLocalTime(date) {
  const parts = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${value("weekday")} · ${value("month")} ${value("day")} · ${value("hour")}:${value("minute")} ${value("dayPeriod")}`.toUpperCase();
}

export function formatZonedTime(date, timeZone) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric", minute: "2-digit", hour12: true, timeZone,
    }).format(date).toUpperCase();
  } catch {
    return null;
  }
}

export function hasDifferentLocalTime(date, timeZone) {
  if (!timeZone) return false;
  try {
    const options = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
    const visitorTime = new Intl.DateTimeFormat("en-US", options).format(date);
    const propertyTime = new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(date);
    return visitorTime !== propertyTime;
  } catch {
    return false;
  }
}

export function rainChanceFromForecast(payload) {
  const times = payload?.hourly?.time;
  const probabilities = payload?.hourly?.precipitation_probability;
  const currentTime = payload?.current?.time;
  if (!Array.isArray(times) || !Array.isArray(probabilities) || !currentTime) return null;
  let index = times.indexOf(currentTime);
  if (index < 0) index = times.findIndex((time) => time >= currentTime);
  const chance = Number(probabilities[index]);
  return Number.isFinite(chance) ? Math.round(chance) : null;
}

export function compactPlaceName(value) {
  const label = String(value || "").trim();
  if (!label) return null;
  if (/bonifacio global city/i.test(label)) return "BGC";
  const primary = label.split(",")[0].trim();
  return (primary || label).toUpperCase().slice(0, 22);
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null") || {}; }
  catch { return {}; }
}

function writeCache(value) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); }
  catch { /* Private browsing can disable storage; in-memory data still works. */ }
}

function normalizePropertyContext(context) {
  const latitude = Number(context?.latitude);
  const longitude = Number(context?.longitude);
  const shortName = compactPlaceName(context?.shortName);
  const contextKey = String(context?.key || "").trim();
  if (context?.source !== "property" || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !shortName || !contextKey) return null;
  return {
    contextKey,
    source: "property",
    latitude,
    longitude,
    shortName,
    updatedAt: Date.now(),
  };
}

export function cacheablePropertyLocation(location) {
  if (location?.source !== "property" || !location?.contextKey || !location?.shortName) return null;
  return {
    contextKey: location.contextKey,
    source: "property",
    shortName: location.shortName,
    updatedAt: Date.now(),
  };
}

function item(id, segments, mobileSegments, duration = 5000) {
  const text = segments.map((segment) => segment.text).join(" · ");
  return { id, text, segments, mobileSegments, duration };
}

const token = (text, tone) => ({ text: String(text), tone });

export function buildAmbientItems({ ambient, now, user }) {
  const items = [];
  const location = ambient?.location;
  const isProperty = location?.source === "property";
  const displayName = user?.firstName || user?.display_name || user?.name;
  const firstName = typeof displayName === "string" ? displayName.trim().split(/\s+/)[0] : "";

  if (!isProperty && firstName && now) {
    items.push(item("greeting", [token(`${greetingForHour(now.getHours())}, ${firstName.toUpperCase()}`, "value")], [token(firstName.toUpperCase(), "value")]));
  }
  if (!isProperty && now) {
    const localTime = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now).toUpperCase();
    items.push(item("time", [token("LOCAL TIME", "label"), token(formatLocalTime(now), "value")], [token("LOCAL TIME", "label"), token(localTime, "value")]));
  }

  if (location?.shortName && ambient?.weather) {
    const { shortName } = location;
    const { temperature, condition, humidity, feelsLike, rainChance, timezone } = ambient.weather;
    items.push(item("weather", [
      token(shortName, "context"), token("WEATHER", "label"), token(`${temperature}°C`, "value"), token(condition, "detail"),
    ], [token(shortName, "context"), token(`${temperature}°C`, "value")], 6000));

    if (Number.isFinite(rainChance)) {
      items.push(item("rain", [token("RAIN CHANCE", "label"), token(`${rainChance}%`, "value")], [token("RAIN CHANCE", "label"), token(`${rainChance}%`, "value")]));
    }
    if (Number.isFinite(feelsLike)) {
      const comfortSegments = [token("FEELS LIKE", "label"), token(`${feelsLike}°C`, "value")];
      if (Number.isFinite(humidity)) comfortSegments.push(token(`HUMIDITY ${humidity}%`, "detail"));
      items.push(item("comfort", comfortSegments, [token("FEELS LIKE", "label"), token(`${feelsLike}°C`, "value")]));
    }
    if (isProperty && now && hasDifferentLocalTime(now, timezone)) {
      const propertyTime = formatZonedTime(now, timezone);
      if (propertyTime) items.push(item("property-time", [token("LOCAL TIME", "label"), token(propertyTime, "value")], [token("LOCAL TIME", "label"), token(propertyTime, "value")]));
    }
  }

  if (ambient?.air && Number.isFinite(ambient.air.aqi)) {
    const { aqi, label } = ambient.air;
    items.push(item("air", [token("AIR", "label"), token(label, "detail"), token(`AQI ${aqi}`, "value")], [token(`AIR ${label}`, "label"), token(`AQI ${aqi}`, "value")]));
  }
  return items;
}

export function useAmbientData(user, context = null) {
  const [now, setNow] = useState(null);
  const [ambient, setAmbient] = useState(null);
  const propertyContext = useMemo(() => normalizePropertyContext(context), [context]);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const delay = 60_000 - (Date.now() % 60_000);
    let interval;
    const timeout = window.setTimeout(() => {
      update();
      interval = window.setInterval(update, 60_000);
    }, delay);
    return () => { window.clearTimeout(timeout); if (interval) window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let weatherTimer;
    let airTimer;
    let cached = readCache();

    if (!propertyContext) {
      // Older builds cached visitor coordinates. Remove that legacy data and do
      // not request geolocation: generic pages only need greeting + local time.
      if (cached.location) writeCache({});
      setAmbient(null);
      return undefined;
    }

    // Property coordinates are public listing data, but they are still not
    // persisted. Keep them only in this effect closure for API requests.
    if (cached.location?.latitude != null || cached.location?.longitude != null || cached.location?.source !== "property") {
      writeCache({});
      cached = {};
    }
    const cacheMatchesContext = cached.location?.contextKey === propertyContext.contextKey;
    if (cacheMatchesContext) {
      const cachedDisplay = {
        ...cached,
        weather: cached.weather && Date.now() - cached.weather.updatedAt < WEATHER_TTL ? cached.weather : null,
        air: cached.air && Date.now() - cached.air.updatedAt < AIR_TTL ? cached.air : null,
      };
      if (cachedDisplay.weather || cachedDisplay.air) setAmbient(cachedDisplay);
    } else {
      setAmbient(null);
    }

    async function refreshWeather(location, force = false) {
      const cachedNow = readCache();
      if (!force && cachedNow.weather && Date.now() - cachedNow.weather.updatedAt < WEATHER_TTL) return;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) return;
        const payload = await response.json();
        const data = payload?.current;
        const condition = weatherCondition(data?.weather_code);
        if (!data || !condition || !location.shortName) return;
        const next = { ...readCache(), location: cacheablePropertyLocation(location), weather: {
          temperature: Math.round(data.temperature_2m),
          feelsLike: Math.round(data.apparent_temperature),
          humidity: Math.round(data.relative_humidity_2m),
          rainChance: rainChanceFromForecast(payload),
          condition,
          timezone: payload?.timezone || null,
          updatedAt: Date.now(),
        } };
        writeCache(next);
        if (!cancelled) setAmbient(next);
      } catch { /* Missing states degrade silently. */ }
    }

    async function refreshAir(location, force = false) {
      const cachedNow = readCache();
      if (!force && cachedNow.air && Date.now() - cachedNow.air.updatedAt < AIR_TTL) return;
      try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&current=us_aqi&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) return;
        const aqi = Math.round((await response.json())?.current?.us_aqi);
        const label = airQualityLabel(aqi);
        if (!label) return;
        const next = { ...readCache(), location: cacheablePropertyLocation(location), air: { aqi, label, updatedAt: Date.now() } };
        writeCache(next);
        if (!cancelled) setAmbient(next);
      } catch { /* Missing states degrade silently. */ }
    }

    async function start() {
      try {
        const location = propertyContext;
        const latest = readCache();
        const contextChanged = latest.location?.contextKey !== location.contextKey;
        const seeded = contextChanged
          ? { location: cacheablePropertyLocation(location), weather: null, air: null }
          : { ...latest, location: cacheablePropertyLocation(location) };
        writeCache(seeded);
        if (!cancelled) setAmbient(seeded);
        await Promise.all([refreshWeather(location), refreshAir(location)]);
        weatherTimer = window.setInterval(() => refreshWeather(location, true), WEATHER_TTL);
        airTimer = window.setInterval(() => refreshAir(location, true), AIR_TTL);
      } catch { /* External conditions degrade silently; the header remains usable. */ }
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const current = readCache();
      if (current.location?.contextKey === propertyContext.contextKey) {
        refreshWeather(propertyContext);
        refreshAir(propertyContext);
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      if (weatherTimer) window.clearInterval(weatherTimer);
      if (airTimer) window.clearInterval(airTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [propertyContext]);

  return useMemo(() => buildAmbientItems({ ambient, now, user }), [ambient, now, user]);
}
