"use client";

import { useEffect, useMemo, useState } from "react";

const CACHE_KEY = "scoutit_ambient_v1";
const WEATHER_TTL = 15 * 60 * 1000;
const AIR_TTL = 25 * 60 * 1000;
const LOCATION_TTL = 24 * 60 * 60 * 1000;

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

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null") || {}; }
  catch { return {}; }
}

function writeCache(value) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); }
  catch { /* Private browsing can disable storage; in-memory data still works. */ }
}

function compactLocation(feature) {
  const label = feature?.text?.trim();
  if (!label) return null;
  if (/bonifacio global city/i.test(label)) return "BGC";
  return label.toUpperCase().slice(0, 22);
}

function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation unavailable"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false, maximumAge: LOCATION_TTL, timeout: 8000,
    });
  });
}

export function useAmbientData(user) {
  const [now, setNow] = useState(null);
  const [ambient, setAmbient] = useState(null);

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
    const cached = readCache();
    const cachedDisplay = {
      ...cached,
      weather: cached.weather && Date.now() - cached.weather.updatedAt < WEATHER_TTL ? cached.weather : null,
      air: cached.air && Date.now() - cached.air.updatedAt < AIR_TTL ? cached.air : null,
    };
    if (cachedDisplay.weather || cachedDisplay.air) setAmbient(cachedDisplay);

    async function resolveLocation() {
      if (cached.location && Date.now() - cached.location.updatedAt < LOCATION_TTL) return cached.location;
      const position = await currentPosition();
      const location = { latitude: position.coords.latitude, longitude: position.coords.longitude, shortName: null, updatedAt: Date.now() };
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (token) {
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.longitude},${location.latitude}.json?types=neighborhood,locality,place&limit=1&access_token=${token}`;
          const response = await fetch(url);
          if (response.ok) location.shortName = compactLocation((await response.json())?.features?.[0]);
        } catch { /* Coordinates remain useful for a later refresh. */ }
      }
      return location;
    }

    async function refreshWeather(location, force = false) {
      const cachedNow = readCache();
      if (!force && cachedNow.weather && Date.now() - cachedNow.weather.updatedAt < WEATHER_TTL) return;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) return;
        const data = (await response.json())?.current;
        const condition = weatherCondition(data?.weather_code);
        if (!data || !condition || !location.shortName) return;
        const next = { ...readCache(), location, weather: {
          temperature: Math.round(data.temperature_2m), feelsLike: Math.round(data.apparent_temperature),
          humidity: Math.round(data.relative_humidity_2m), condition, updatedAt: Date.now(),
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
        const next = { ...readCache(), location, air: { aqi, label, updatedAt: Date.now() } };
        writeCache(next);
        if (!cancelled) setAmbient(next);
      } catch { /* Missing states degrade silently. */ }
    }

    async function start() {
      try {
        const location = await resolveLocation();
        const latest = readCache();
        const moved = latest.location && (
          Math.abs(latest.location.latitude - location.latitude) > 0.01 ||
          Math.abs(latest.location.longitude - location.longitude) > 0.01
        );
        const seeded = moved
          ? { ...latest, location, weather: null, air: null }
          : { ...latest, location };
        writeCache(seeded);
        if (!cancelled) setAmbient(seeded);
        await Promise.all([refreshWeather(location), refreshAir(location)]);
        weatherTimer = window.setInterval(() => refreshWeather(location, true), WEATHER_TTL);
        airTimer = window.setInterval(() => refreshAir(location, true), AIR_TTL);
      } catch { /* No permission: greeting and time remain the complete experience. */ }
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const current = readCache();
      if (current.location) { refreshWeather(current.location); refreshAir(current.location); }
    };
    start();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      if (weatherTimer) window.clearInterval(weatherTimer);
      if (airTimer) window.clearInterval(airTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return useMemo(() => {
    const items = [];
    const displayName = user?.firstName || user?.display_name || user?.name;
    const firstName = typeof displayName === "string" ? displayName.trim().split(/\s+/)[0] : "";
    if (firstName && now) items.push({ id: "greeting", text: `${greetingForHour(now.getHours())}, ${firstName.toUpperCase()}`, mobileText: firstName.toUpperCase(), duration: 5000 });
    if (now) items.push({ id: "time", text: formatLocalTime(now), mobileText: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now).toUpperCase(), duration: 5000 });
    if (ambient?.location?.shortName && ambient?.weather) {
      const { shortName } = ambient.location;
      const { temperature, condition, humidity, feelsLike } = ambient.weather;
      items.push({ id: "weather", text: `${shortName} · ${temperature}° · ${condition}`, mobileText: `${shortName} · ${temperature}°`, duration: 6000 });
      if (Number.isFinite(humidity) && Number.isFinite(feelsLike)) items.push({ id: "comfort", text: `HUMIDITY ${humidity}% · FEELS ${feelsLike}°`, mobileText: `HUMIDITY · ${humidity}%`, duration: 5000 });
    }
    if (ambient?.air && Number.isFinite(ambient.air.aqi)) items.push({ id: "air", text: `AQI ${ambient.air.aqi} · ${ambient.air.label}`, mobileText: `AIR · ${ambient.air.aqi}`, duration: 5000 });
    return items;
  }, [ambient, now, user]);
}
