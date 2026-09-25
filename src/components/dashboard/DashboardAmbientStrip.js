"use client";

import { useEffect, useMemo, useState } from "react";
import AmbientRail from "@/components/layout/ambient/AmbientRail";
import { LOCATION_HUBS } from "@/lib/locationHubs";

const STORAGE_KEY = "scoutit_dashboard_weather_city";
const DEFAULT_HUB = "makati-cbd";

export default function DashboardAmbientStrip({ user }) {
  const [hubSlug, setHubSlug] = useState(DEFAULT_HUB);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (LOCATION_HUBS.some((hub) => hub.slug === saved)) {
        setHubSlug(saved);
        return;
      }
    } catch {
      // A private browser may block storage; the visible city picker still works.
    }

    const focus = String(user?.location_focus || "").toLowerCase();
    const match = LOCATION_HUBS.find((hub) =>
      [hub.city, hub.region, hub.name].some((name) =>
        focus.includes(name.toLowerCase())
      )
    );
    if (match) setHubSlug(match.slug);
  }, [user?.location_focus]);

  const hub = LOCATION_HUBS.find((item) => item.slug === hubSlug) ||
    LOCATION_HUBS.find((item) => item.slug === DEFAULT_HUB);
  const context = useMemo(() => ({
    key: `dashboard:${hub.slug}`,
    source: "dashboard",
    latitude: hub.lat,
    longitude: hub.lng,
    shortName: hub.region,
  }), [hub]);

  const chooseHub = (event) => {
    const next = event.target.value;
    if (!LOCATION_HUBS.some((item) => item.slug === next)) return;
    setHubSlug(next);
    try { localStorage.setItem(STORAGE_KEY, next); }
    catch { /* The selection still works for this visit. */ }
  };

  return (
    <div className="dashboard-ambient-strip">
      <div className="dashboard-ambient-rail">
        <AmbientRail user={user} context={context} />
      </div>
      <label className="dashboard-ambient-city">
        <span>Forecast</span>
        <select aria-label="Weather forecast city" value={hub.slug} onChange={chooseHub}>
          {LOCATION_HUBS.map((item) => (
            <option key={item.slug} value={item.slug}>{item.region}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
