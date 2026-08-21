"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { feature } from "topojson-client";

import { addSolarSystem } from "./solarSystem";

import "./scout-earth.css";

/*
 * SCOUT EARTH — Orbit layer.
 *
 * The Earth is black. Gold reveals intelligence; gold does not replace the
 * Earth. Country geometry is real (world-atlas 110m), not drawn by hand.
 *
 * Architecture note: every future intelligence layer (pointsData, ringsData,
 * arcsData, labelsData, hexPolygonsData, customLayerData) attaches to the
 * same <Globe> instance below. Nothing here forecloses them — the base Earth
 * is deliberately kept as the only thing this component owns.
 */

const BLACK = "#020202";
const GOLD = "#D4AF37";

/* Vendored to /public rather than fetched from jsdelivr. The site's CSP
   `connect-src` (next.config.mjs) does not list cdn.jsdelivr.net, so the CDN
   fetch was blocked outright and the globe rendered with zero geography.
   Widening CSP for a 107KB static file that never changes is the worse
   trade: same-origin is faster, works offline, and adds no third party. */
const COUNTRIES_URL = "/geo/countries-110m.json";

/* Southeast Asia / the Philippines, with the WHOLE sphere in frame.
   Orbit establishes the planet; Stratosphere and Metropolis are where the
   camera is allowed to get close. Altitude is solved, not guessed:
   globe.gl uses radius 100 and a 50deg camera, so the sphere's angular
   radius is asin(100 / (100 * (1 + altitude))). At 2.8 that is 15.3deg
   against a 25deg half-FOV — the full circle fits with real negative space
   around it, and Earth occupies ~61% of viewport height (target 55-70%).
   The previous 2.15 gave 74%, which crowded the frame. */
const INITIAL_POV = { lat: 14, lng: 121, altitude: 2.8 };

/* Absolute floor for the canvas. Every width source can read 0 — a collapsed
   pane, a display:none ancestor, a container measured before layout — and a
   zero size means the globe is never rendered at all. A too-small canvas that
   the ResizeObserver immediately corrects is a far better failure than a
   permanently blank Orbit. */
const MIN_STAGE = { width: 320, height: 430 };

const CAP_REST = "rgba(212, 175, 55, 0.045)";
const CAP_HOVER = "rgba(212, 175, 55, 0.085)";
const STROKE = "rgba(212, 175, 55, 0.28)";
const SIDE = "rgba(212, 175, 55, 0.01)";

/* Cities read brighter than borders — they are the point of the descent. */
const POINT_CITY = "rgba(212, 175, 55, 0.55)";
const POINT_LIVE = "#F2D675";
const LABEL_GOLD = "rgba(242, 214, 117, 0.55)";
const RING_GOLD = (t) => `rgba(247, 198, 78, ${Math.max(0, 1 - t) * 0.5})`;

export default function ScoutEarth({
  /* Orbit establishes the planet (2.8 = whole sphere in frame).
     Stratosphere descends toward it. Same Earth, same real geography,
     different altitude — not a second, hand-drawn planet. */
  altitude = 2.8,
  descendTo = null,
  descendMs = 10000,
  autoRotate = true,
  interactive = true,
  /* Cities / signals to surface on the globe. Country polygons are 110m
     borders — there is no city in them, so at low altitude they are just
     large empty shapes. A "metropolis" at globe scale IS this data: a
     cluster of lit points with names. */
  points = [],
  /* Starfield + orbital paths around the planet. On for Orbit, where the
     Earth is the subject; off for the Stratosphere backdrop, where the
     descent is already carrying the motion. */
  showSolarSystem = false,
  className = "",
}) {
  const globeRef = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [countries, setCountries] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [dragging, setDragging] = useState(false);

  /* ── Real country geometry ──────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(COUNTRIES_URL, { signal: controller.signal });
        if (!res.ok) return;
        const topo = await res.json();
        const geo = feature(topo, topo.objects.countries);
        if (!cancelled) setCountries(geo.features || []);
      } catch {
        // Offline or blocked: the Earth still renders as a dark sphere with
        // its atmosphere. Geography is an enhancement, not a dependency.
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  /* ── Responsive sizing. Never hardcoded. ────────────────────────── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    /* A zero measurement must never mean "render nothing".
       The globe is gated on having a size, so if the first
       getBoundingClientRect returns 0x0 — a container not yet laid out, a
       parent mid-transition, a throttled/hidden renderer — the globe never
       mounts and there is no second chance beyond a ResizeObserver that may
       itself be paused. Falling back to the viewport keeps a real canvas on
       screen; the observer corrects it the moment a true size exists. */
    const measure = () => {
      const r = el.getBoundingClientRect();
      const width =
        r.width || el.offsetWidth || window.innerWidth || MIN_STAGE.width;
      const height =
        r.height ||
        el.offsetHeight ||
        Math.round(window.innerHeight * 0.7) ||
        MIN_STAGE.height;

      setSize((prev) =>
        Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1
          ? prev
          : {
              width: Math.max(width, MIN_STAGE.width),
              height: Math.max(height, MIN_STAGE.height),
            }
      );
    };

    measure();
    // One deferred re-measure: fonts, layout and the dynamic import all
    // settle after mount, and the first frame is often not the real size.
    const settle = setTimeout(measure, 250);

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      clearTimeout(settle);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  /* ── The planet itself. Almost black; lighting gives it form. ───── */
  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: new THREE.Color(BLACK),
        emissive: new THREE.Color("#050402"),
        emissiveIntensity: 0.18,
        specular: new THREE.Color("#8D7025"),
        shininess: 18,
      }),
    []
  );

  /* ── Three intentional lights, not Globe.gl's defaults. ───────────
     Intensities are multiplied by PI. Three.js r155+ switched to
     physically-correct light units, and this project runs r184 — the
     same numbers that were correct pre-r155 are roughly 3x too dim now.
     globe.gl's own default ambient is literally `Math.PI` for exactly
     this reason. Without the scale the black material receives almost no
     light, the phong surface renders pure black, and globe.gl's polygon
     caps (a light-dependent material) go black with it: the entire globe
     becomes invisible against the page.

     The RATIOS below are the intended art direction; only the absolute
     scale is corrected. */
  const lights = useMemo(() => {
    const ambient = new THREE.AmbientLight("#3B3014", 0.45 * Math.PI);

    const key = new THREE.DirectionalLight("#E5C35C", 2.2 * Math.PI);
    key.position.set(-3, 2, 4);

    const rim = new THREE.DirectionalLight("#80651F", 0.65 * Math.PI);
    rim.position.set(3, 0, -3);

    return [ambient, key, rim];
  }, []);

  /* Points carrying a live status also get a pulsing ring, so the eye lands
     on what is actually moving rather than on every city equally. */
  const livePoints = useMemo(
    () => points.filter((p) => Boolean(p.status)),
    [points]
  );

  const rendererConfig = useMemo(() => ({ antialias: true, alpha: true }), []);

  /* ── Controls: orbital drift, and the page keeps its scroll. ──────
     Applied idempotently, and NOT solely from onGlobeReady.

     onGlobeReady fires off globe.gl's first render tick, so anything that
     defers rAF — a background tab, a hidden pane, a throttled renderer —
     delays or drops it. Everything below would then never run, including
     `enableZoom = false`, which is what stops the globe eating the page
     scroll. Losing the camera angle is cosmetic; losing that line breaks
     the descent. It is not allowed to depend on one callback firing. */
  const configured = useRef(false);
  const solarSystemRef = useRef(null);
  const solarFrameRef = useRef(null);

  const configure = useCallback(() => {
    if (configured.current) return true;

    const globe = globeRef.current;
    if (!globe || typeof globe.controls !== "function") return false;

    const controls = globe.controls();
    if (!controls) return false;

    configured.current = true;

    /* Lights are applied HERE, imperatively — the `lights` prop does not
       take in react-globe.gl 2.38. Verified live: with the prop set, the
       scene still held globe.gl's two defaults (AmbientLight 3.14 #cccccc,
       DirectionalLight 1.88 #ffffff) and none of the three below. Calling
       globe.lights() replaces them correctly.

       This was the whole reason the Earth was invisible: `globeMaterial`,
       the atmosphere and all 177 country polygons applied fine, but a
       near-black material under generic white lighting has no gold in it
       at all, so nothing read. */
    globe.lights(lights);

    /* Dev-only handle. This component is pure WebGL: when it renders wrong
       there is nothing in the DOM to inspect, and "I can't see it" is not a
       debuggable report. `window.__scoutEarth` exposes the scene, camera and
       renderer so the globe can be interrogated from the console instead of
       guessed at. Stripped from production builds. */
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      window.__scoutEarth = globe;
    }

    if (showSolarSystem) {
      const system = addSolarSystem(THREE, globe.scene(), globe.camera());
      solarSystemRef.current = system;

      /* The sky and the rings stay; only their drift stops. Reduced motion
         means less movement, not a stripped-out scene. */
      const noDrift =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* globe.gl owns its own render loop and exposes no per-frame hook, so
         the orbital drift runs on its own rAF. It only mutates a rotation
         on three groups — no re-render, no React state. */
      if (!noDrift) {
        const spin = () => {
          if (!solarSystemRef.current) return;
          system.tick();
          solarFrameRef.current = requestAnimationFrame(spin);
        };
        solarFrameRef.current = requestAnimationFrame(spin);
      }
    }

    globe.pointOfView({ ...INITIAL_POV, altitude }, 0);

    /* The descent. globe.gl tweens the camera itself, so the fall is a
       single call rather than a hand-rolled rAF loop — and it lands on real
       country geometry instead of a painted canvas. */
    if (descendTo != null) {
      const still =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (still) {
        globe.pointOfView({ ...INITIAL_POV, altitude: descendTo }, 0);
      } else {
        globe.pointOfView({ ...INITIAL_POV, altitude: descendTo }, descendMs);
      }
    }

    // Orbital drift is decorative motion. Someone who asked for less of it
    // still gets the planet, just without the constant rotation.
    const stillPreferred =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    controls.autoRotate = autoRotate && !stillPreferred;
    controls.autoRotateSpeed = 0.22;
    controls.enableRotate = interactive;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    // The descent depends on this: dragging rotates the planet, the wheel
    // still scrolls the page through Orbit -> Stratosphere -> Metropolis.
    controls.enableZoom = false;
    controls.enablePan = false;

    controls.addEventListener("start", () => setDragging(true));
    controls.addEventListener("end", () => setDragging(false));
    return true;
  }, [lights, altitude, descendTo, descendMs, autoRotate, interactive, showSolarSystem]);

  // Belt and braces: the callback when it fires, a short poll when it does not.
  const handleReady = useCallback(() => {
    configure();
  }, [configure]);

  useEffect(() => {
    if (configure()) return undefined;
    const id = setInterval(() => {
      if (configure()) clearInterval(id);
    }, 120);
    // Give up after ~6s rather than polling for the life of the page.
    const stop = setTimeout(() => clearInterval(id), 6000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [configure]);

  /* Dispose GPU resources this component created. Globe.gl owns its own
     scene teardown; these two are ours. */
  useEffect(
    () => () => {
      globeMaterial.dispose();
      lights.forEach((l) => l.dispose && l.dispose());
      if (solarFrameRef.current) cancelAnimationFrame(solarFrameRef.current);
      if (solarSystemRef.current) {
        solarSystemRef.current.dispose();
        solarSystemRef.current = null;
      }
    },
    [globeMaterial, lights]
  );

  const capColor = useCallback(
    (d) => (d === hovered ? CAP_HOVER : CAP_REST),
    [hovered]
  );

  const ready = size.width > 0 && size.height > 0;

  return (
    <div
      ref={wrapRef}
      className={`scout-earth${dragging ? " is-dragging" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="scout-earth__glow" aria-hidden="true" />

      <div className="scout-earth__stage" aria-hidden="true">
        {ready ? (
          /* No `lights` prop here on purpose: it does not apply in
             react-globe.gl 2.38. Lights are set imperatively in configure(). */
          <Globe
            ref={globeRef}
            width={size.width}
            height={size.height}
            onGlobeReady={handleReady}
            /* The Orbit page owns the background. */
            backgroundColor="rgba(0,0,0,0)"
            rendererConfig={rendererConfig}
            /* No globeImageUrl: the surface is our own material. */
            globeMaterial={globeMaterial}
            showAtmosphere
            atmosphereColor={GOLD}
            atmosphereAltitude={0.08}
            polygonsData={countries}
            polygonCapColor={capColor}
            polygonStrokeColor={() => STROKE}
            polygonSideColor={() => SIDE}
            polygonAltitude={0.002}
            polygonsTransitionDuration={0}
            onPolygonHover={setHovered}
            /* ── CITIES ── */
            pointsData={points}
            pointLat={(d) => d.lat}
            pointLng={(d) => d.lng}
            pointColor={(d) => (d.status ? POINT_LIVE : POINT_CITY)}
            pointAltitude={0.007}
            pointRadius={(d) => (d.status ? 0.32 : 0.22)}
            pointsMerge={false}
            /* ── NAMES ── */
            labelsData={points}
            labelLat={(d) => d.lat}
            labelLng={(d) => d.lng}
            labelText={(d) => d.city || ""}
            labelSize={0.22}
            labelDotRadius={0}
            labelColor={() => LABEL_GOLD}
            labelResolution={2}
            labelAltitude={0.014}
            /* ── WHAT IS MOVING ── */
            ringsData={livePoints}
            ringLat={(d) => d.lat}
            ringLng={(d) => d.lng}
            ringColor={() => RING_GOLD}
            ringMaxRadius={2.4}
            ringPropagationSpeed={1.1}
            ringRepeatPeriod={1600}
          />
        ) : null}
      </div>
    </div>
  );
}
