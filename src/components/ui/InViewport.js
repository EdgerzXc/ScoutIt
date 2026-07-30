"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Defers mounting children until the wrapper scrolls near the viewport.
 *
 * WHY THIS EXISTS
 * ---------------
 * `next/dynamic` splits a component into its own chunk, but it does NOT delay
 * mounting: the moment the parent renders, the chunk is fetched and the
 * component initialises. On the property page that meant every visitor pulled
 * maplibre-gl (~1MB parsed, ~1.7s of CPU) and Leaflet plus ~500KB of vector
 * tiles on arrival, for maps sitting thousands of pixels below the fold. That
 * was the single largest contributor to Total Blocking Time.
 *
 * Wrapping a map in <InViewport> keeps the split AND delays the work until the
 * section is actually approached. `rootMargin` starts the load before the map
 * is visible, so by the time it scrolls in it has usually already painted —
 * the reader sees no difference.
 *
 * The wrapper renders at the same dimensions whether or not the child has
 * mounted, so nothing reflows when it swaps in (CLS stays at 0).
 *
 * @param {object}          props
 * @param {React.ReactNode} props.children  Mounted once the wrapper nears the viewport.
 * @param {React.ReactNode} [props.fallback] Shown until then. Should match the child's height.
 * @param {string}          [props.rootMargin] How early to start. Default "400px".
 * @param {object}          [props.style]   Applied to the wrapper in both states.
 * @param {string}          [props.className]
 */
export default function InViewport({
  children,
  fallback = null,
  rootMargin = "400px",
  style,
  className,
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;

    const el = ref.current;
    if (!el) return;

    // Older browsers (and anything that blocks the API) get the map immediately
    // rather than never — degrading to today's behaviour, not to a blank box.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shown, rootMargin]);

  return (
    <div ref={ref} style={style} className={className}>
      {shown ? children : fallback}
    </div>
  );
}
