"use client";

import { Children, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSimpleMode } from "@/hooks/useSimpleMode";
import { sidebarGroupCollapsed, sidebarGroupVisible } from "@/lib/simpleModeSurfaces";

// A-083 phase 1 — secondary sidebar fields, behind one expander in Simple.
//
// Specification §6.1: "labels and values are never removable, so what changes
// is grouping. Tier-gated and secondary fields gather behind one 'All details'
// expander. Type, Location, Tenure, Total Floor Area, the category capacity
// figure, Year Built, Verification and Intel source stay inline."
//
// ── WHAT THIS IS NOT ─────────────────────────────────────────────────
// It does not remove a field, ever. `detail` collapses, it never deletes, so
// everything hidden here is one visible control away — acceptance test 5. In
// Pro this component renders its children with no wrapper behaviour at all, so
// the Pro sidebar is byte-identical to before (Rule A, acceptance test 0).
//
// The classification is structural — which blocks a caller places inside — not
// a list of field names kept somewhere. That keeps Rule B intact: no parallel
// content, nothing to drift.
export default function SidebarDetails({ children, label = "All details" }) {
  const simple = useSimpleMode();
  const [open, setOpen] = useState(false);
  const collapsed = sidebarGroupCollapsed(simple, false);

  // A-085 phase 1. `Children.toArray` drops the `false` a `{cond && <div/>}`
  // leaves behind, so this counts the blocks that actually rendered. A group
  // whose fields are all absent on this listing is nothing, not an expander
  // that opens onto nothing — and in Pro that was already an empty fragment,
  // so the Pro sidebar is unchanged either way (Rule A).
  if (!sidebarGroupVisible(Children.toArray(children).length)) return null;

  // Pro, or Simple with the group already opened: render exactly as before.
  if (!collapsed || open) {
    return (
      <>
        {collapsed && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-expanded="true"
            className="sidebar-details-toggle"
          >
            {label}
            <ChevronDown size={14} aria-hidden="true" style={{ transform: "rotate(180deg)" }} />
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
      className="sidebar-details-toggle"
    >
      {label}
      <ChevronDown size={14} aria-hidden="true" />
    </button>
  );
}
