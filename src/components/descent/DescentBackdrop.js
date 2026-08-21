"use client";

import { useCallback, useEffect, useState } from "react";

import ScoutEarth from "@/components/orbit/ScoutEarthClient";
import CityApproach from "@/components/descent/CityApproach";
import { getSignals } from "@/data/mock/mockArticles";
import "./descent-backdrop.css";

/*
 * THE DESCENT — two stages, because no single renderer covers the range.
 *
 *   0.0s  ── globe, real country geometry, whole planet in frame
 *           MapLibre mounts hidden and preloads the ARRIVAL view
 *   5.5s  ── cross-fade, but only once the city reports itself loaded
 *  11.5s  ── Metro Manila, real streets, real buildings extruded
 *
 * The city is warmed before it is ever shown, so the land arrives with the
 * metropolis already standing on it rather than assembling in view.
 *
 * Why two: the globe's geometry is 110m COUNTRY BORDERS. There is nothing
 * inside a country outline at any altitude, so descending on the globe alone
 * only enlarges empty polygons — measured, a city is 0.8% of the frame at
 * altitude 0.15 and the sphere is already at 242% of frame height by then,
 * flooding the screen. A globe cannot show a city. MapLibre can, and the
 * dark basemap carries real building footprints.
 *
 * So the globe does the part it is good at (establishing the planet and the
 * approach) and hands over before it runs out of detail.
 */

const HANDOVER_MS = 5500;

/* Hard deadline for waiting on the city. Beyond this the descent hands over
   regardless — a blocked CDN, a failed WebGL context or a `load` event that
   never fires must never strand the reader on the globe. Waiting for a
   callback with no timeout of its own is exactly how `onGlobeReady` broke
   the Orbit controls. */
const CITY_WAIT_CEILING_MS = 9000;

export default function DescentBackdrop() {
  /* The handover needs BOTH: enough time to have flown, and a city that has
     actually finished loading. Firing on the timer alone hands over to a
     map still fetching its skyline, and the reader watches the metropolis
     assemble itself. Whichever condition lands second triggers it. */
  const [timeUp, setTimeUp] = useState(false);
  const [cityReady, setCityReady] = useState(false);
  const [waitedLongEnough, setWaitedLongEnough] = useState(false);
  const arrived = timeUp && (cityReady || waitedLongEnough);

  const handleCityReady = useCallback(() => setCityReady(true), []);

  useEffect(() => {
    const still =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion still lands on the city — it just does not fly there.
    if (still) {
      setTimeUp(true);
      setWaitedLongEnough(true);
      return undefined;
    }

    const id = setTimeout(() => setTimeUp(true), HANDOVER_MS);
    const ceiling = setTimeout(
      () => setWaitedLongEnough(true),
      CITY_WAIT_CEILING_MS
    );
    return () => {
      clearTimeout(id);
      clearTimeout(ceiling);
    };
  }, []);

  return (
    <div className="descent-stage">
      {/* Stage 2 sits underneath and fades up through stage 1. */}
      <CityApproach
        active={arrived}
        durationMs={6000}
        onReady={handleCityReady}
      />

      <div className={`descent-stage__globe${arrived ? " is-gone" : ""}`}>
        <ScoutEarth
          altitude={2.6}
          descendTo={1.55}
          descendMs={HANDOVER_MS + 1500}
          autoRotate={false}
          interactive={false}
          points={getSignals()}
          className="scout-earth--backdrop"
        />
      </div>
    </div>
  );
}
