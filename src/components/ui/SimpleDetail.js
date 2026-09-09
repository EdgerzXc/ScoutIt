"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSimpleMode } from "@/hooks/useSimpleMode";
import { detailGroupCollapsed } from "@/lib/simpleModeSurfaces";

// A-083 — a whole secondary block, behind one honest expander in Simple.
//
// This is the `detail` role's rendering, shared by every surface from phase 2
// onward. `SidebarDetails` is the same idea with the property sidebar's own
// styling; this is the section-level form used by the dashboards, the dossier
// and the layers.
//
// ── IT COLLAPSES, IT NEVER DELETES ───────────────────────────────────
// The children stay in the tree behind a visible, labelled, keyboard-reachable
// control, which is acceptance test 5. In Pro the component is a pass-through:
// `detailGroupCollapsed` is false, so it renders exactly its children with no
// wrapper behaviour at all, and Pro is byte-identical to before (Rule A).
//
// The label is NOT Simple copy. It is the section's own heading, passed in by
// the caller from the words already on the page — Rule B forbids authoring a
// parallel string, and this reuses rather than writes.
export default function SimpleDetail({ children, label }) {
  const simple = useSimpleMode();
  const [open, setOpen] = useState(false);
  const collapsed = detailGroupCollapsed(simple, open);

  if (!collapsed) {
    return (
      <>
        {simple && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-expanded="true"
            className="simple-detail-toggle"
          >
            {label}
            <ChevronDown size={16} aria-hidden="true" style={{ transform: "rotate(180deg)" }} />
          </button>
        )}
        {children}
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-expanded="false"
      className="simple-detail-toggle"
    >
      {label}
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );
}
