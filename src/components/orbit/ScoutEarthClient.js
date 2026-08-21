"use client";

import dynamic from "next/dynamic";

/* Imported HERE as well as in ScoutEarth so the reserve box has its
   dimensions before the lazy chunk arrives. CSS imported only inside the
   dynamic component ships with that chunk, which is exactly too late to
   prevent the layout shift it exists to prevent. */
import "./scout-earth.css";

/*
 * WebGL boundary for the Orbit Earth.
 *
 * Import THIS from Orbit, never ScoutEarth directly. Keeping the dynamic
 * import in one place means react-globe.gl and three stay out of every other
 * bundle, and there is exactly one file to look at if the globe ever needs to
 * be swapped, feature-flagged, or turned off.
 *
 * The loading state is an empty box at the component's real height — no
 * spinner, no skeleton, no placeholder card. It reserves the space so the
 * page never shifts when WebGL initialises, and the swap-in is invisible.
 */

const ScoutEarth = dynamic(() => import("./ScoutEarth"), {
  ssr: false,
  loading: () => (
    <div className="scout-earth-reserve" aria-hidden="true" />
  ),
});

export default ScoutEarth;
