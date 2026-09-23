"use client";

import { useEffect, useState } from "react";

// A-153 — skip-to-content link. Pages own their <main> (40+ of them), so the
// layout cannot wrap children in one without nesting mains. Instead the link
// targets the current main ID and assigns #main-content when it lacks one.
// Streamed and navigated content is tracked — progressive enhancement, zero
// page edits. Styled to appear only on keyboard focus.

export const SKIP_TARGET_ID = "main-content";

export default function SkipLink() {
  const [targetId, setTargetId] = useState(null);

  // Streamed pages and client navigation can replace <main> without
  // rerendering this persistent layout. Keep the link tied to a real target,
  // including pages that already have their own main ID.
  useEffect(() => {
    const syncTarget = () => {
      const main = document.querySelector("main");
      if (!main) {
        setTargetId(null);
        return;
      }
      if (!main.id) main.id = SKIP_TARGET_ID;
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      setTargetId(main.id);
    };
    syncTarget();
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!targetId) return null;

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded focus:border focus:border-[var(--accent,var(--accent))] focus:bg-[#0d0d0d] focus:px-4 focus:py-3 focus:font-mono focus:text-[12px] focus:uppercase focus:tracking-[0.12em] focus:text-[var(--accent,var(--accent))]"
    >
      Skip to main content
    </a>
  );
}
