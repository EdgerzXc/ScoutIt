"use client";

import { useEffect, useState } from "react";
import { SIMPLE_MODE_EVENT, isSimpleMode } from "@/lib/simpleMode";

// A-083 phase 1 — live Simple-mode state for client components.
//
// Starts false on the server AND on the first client render, then syncs in an
// effect. That ordering is deliberate: `isSimpleMode()` reads a DOM class the
// no-flash script sets before paint, so reading it during render would make
// the server and client markup disagree and produce a hydration mismatch.
//
// False-first is also the safe direction. The first paint is Pro — everything
// visible — and Simple applies a frame later. If this hook ever fails to run,
// the page stays Pro, which is the fail-open behaviour Rule A requires.
export function useSimpleMode() {
  const [simple, setSimple] = useState(false);

  useEffect(() => {
    const sync = () => setSimple(isSimpleMode());
    sync();
    window.addEventListener(SIMPLE_MODE_EVENT, sync);
    return () => window.removeEventListener(SIMPLE_MODE_EVENT, sync);
  }, []);

  return simple;
}

export default useSimpleMode;
