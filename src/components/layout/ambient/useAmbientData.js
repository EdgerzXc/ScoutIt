"use client";

import { useState, useEffect, useMemo } from "react";

// Weather code to short editorial text map (Open-Meteo WMO weather interpretation codes)
function getWeatherCondition(code) {
  if (code === 0) return "CLEAR";
  if (code === 1 || code === 2) return "PARTLY CLOUDY";
  if (code === 3) return "OVERCAST";
  if (code >= 45 && code <= 48) return "FOG";
  if (code >= 51 && code <= 55) return "DRIZZLE";
  if (code >= 61 && code <= 65) return "RAIN";
  if (code >= 80 && code <= 82) return "TROPICAL SHOWER";
  if (code >= 95 && code <= 99) return "THUNDERSTORM";
  return "CLEAR";
}

// AQI qualitative categorization based on US EPA AQI standard
function getAQILabel(aqi) {
  if (aqi <= 50) return "EXCELLENT";
  if (aqi <= 100) return "MODERATE";
  if (aqi <= 150) return "SENSITIVE";
  if (aqi <= 200) return "UNHEALTHY";
  if (aqi <= 300) return "VERY UNHEALTHY";
  return "HAZARDOUS";
}

export function useAmbientData(user) {
  const [timeState, setTimeState] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [aqiData, setAqiData] = useState(null);

  // 1. Clock & Date state updater (updates once per minute)
  useEffect(() => {
    function updateClock() {
      const now = new Date();

      // Editorial format: SAT · AUG 08 · 8:21 PM
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dateNum = String(now.getDate()).padStart(2, "0");

      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12

      const formattedDate = `${dayName} · ${monthName} ${dateNum} · ${hours}:${minutes} ${ampm}`;

      setTimeState({
        rawDate: now,
        formatted: formattedDate,
        hour: now.getHours(),
      });
    }

    updateClock();
    const interval = setInterval(updateClock, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // 2. Ambient Weather & Air Quality Fetcher (Open-Meteo, BGC/Manila ambient coords)
  useEffect(() => {
    let cancelled = false;

    // Ambient location default: BGC / Metro Manila (14.5547, 121.0244)
    const lat = 14.5547;
    const lon = 121.0244;
    const locationName = "BGC";

    async function fetchWeather() {
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=Asia%2FManila`;
        const res = await fetch(weatherUrl);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.current) return;

        const current = data.current;
        setWeatherData({
          location: locationName,
          temp: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: Math.round(current.relative_humidity_2m),
          condition: getWeatherCondition(current.weather_code),
        });
      } catch {
        // Graceful degradation: leave weatherData null
      }
    }

    async function fetchAqi() {
      try {
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=Asia%2FManila`;
        const res = await fetch(aqiUrl);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.current?.us_aqi) return;

        const aqiVal = Math.round(data.current.us_aqi);
        setAqiData({
          val: aqiVal,
          label: getAQILabel(aqiVal),
        });
      } catch {
        // Graceful degradation: leave aqiData null
      }
    }

    fetchWeather();
    fetchAqi();

    // Refresh weather every 15 mins, AQI every 25 mins
    const weatherTimer = setInterval(fetchWeather, 15 * 60 * 1000);
    const aqiTimer = setInterval(fetchAqi, 25 * 60 * 1000);

    // Refresh on window refocus if stale
    function onFocus() {
      fetchWeather();
      fetchAqi();
    }
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(weatherTimer);
      clearInterval(aqiTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // 3. Construct display states dynamically
  const items = useMemo(() => {
    const list = [];

    // State 01: PERSON (Greeting) — Only if user exists!
    if (user?.name || user?.firstName) {
      const name = (user.firstName || user.name.split(" ")[0] || "MASTER").toUpperCase();
      const hour = timeState?.hour ?? new Date().getHours();
      let timeGreeting = "GOOD EVENING";
      if (hour >= 5 && hour < 12) timeGreeting = "GOOD MORNING";
      else if (hour >= 12 && hour < 18) timeGreeting = "GOOD AFTERNOON";

      list.push({
        id: "greeting",
        text: `${timeGreeting}, ${name}`,
        duration: 5000,
      });
    }

    // State 02: TIME (Date & Time)
    if (timeState?.formatted) {
      list.push({
        id: "time",
        text: timeState.formatted,
        duration: 5000,
      });
    }

    // State 03: WEATHER
    if (weatherData) {
      list.push({
        id: "weather",
        text: `${weatherData.location} · ${weatherData.temp}° · ${weatherData.condition}`,
        duration: 6000,
      });
    }

    // State 04: COMFORT
    if (weatherData?.humidity != null && weatherData?.feelsLike != null) {
      list.push({
        id: "comfort",
        text: `HUMIDITY ${weatherData.humidity}% · FEELS ${weatherData.feelsLike}°`,
        duration: 5000,
      });
    }

    // State 05: AIR
    if (aqiData) {
      list.push({
        id: "air",
        text: `AIR QUALITY ${aqiData.val} · ${aqiData.label}`,
        duration: 5000,
      });
    }

    return list;
  }, [user, timeState, weatherData, aqiData]);

  return items;
}
