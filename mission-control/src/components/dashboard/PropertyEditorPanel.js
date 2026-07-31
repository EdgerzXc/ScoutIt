"use client";

// ═══════════════════════════════════════════════════════════════
// PROPERTY EDITOR PANEL — the staff console's entry point to the
// shared PropertySectionEditor.
//
// This is the staff-console half of a fix documented in
// NEW_IDEAS_TO_CLAUDE_CODE B7: the section editor existed only inside the MAIN
// app's `MissionControlMode`, which is reachable solely through the dev toolbox
// and is labelled "preview only". Staff could not reach it at all, so listing
// specs were only editable by the listing's owner.
//
// The editor itself is vendored byte-identical from the main app (the drift test
// in the MAIN repo asserts that), which is why all the staff-console-specific
// behaviour lives out here in the wrapper instead of being patched into it.
//
// Why the record is fetched on expand rather than passed down: the CMS list
// query omits `details` on purpose. Loading every blob to render a queue of 50
// would make the page pay for editors nobody opened.
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import PropertySectionEditor from "./PropertySectionEditor";
import { categoryKeyFor } from "@/lib/propertyFieldRegistry";

export default function PropertyEditorPanel({ propertyId, spaceCategory }) {
  const [open, setOpen] = useState(false);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggle = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    // Only fetch the first time. Re-opening a row shouldn't re-request, and
    // must not clobber an in-progress draft the staff member hasn't saved.
    if (property || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/property?id=${encodeURIComponent(propertyId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load this listing.");
      setProperty(json.property);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [open, property, loading, propertyId]);

  // categoryKeyFor returns null when the stored category matches nothing. The
  // editor treats null as "shared fields only" rather than guessing a category
  // and hiding the fields that actually apply.
  const category = categoryKeyFor(spaceCategory ?? property?.space_category);

  return (
    <div className="border-t border-white/5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-wide text-white/40 hover:text-[#E8AE3C] hover:bg-white/[0.02] transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        Edit listing details
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
      </button>

      {open && (
        <div className="px-6 pb-6">
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </p>
          )}
          {!error && !property && !loading && (
            <p className="text-xs text-white/40">No details recorded for this listing yet.</p>
          )}
          {property && (
            <PropertySectionEditor
              property={property}
              category={category}
              // Staff: the internal block renders, and the route re-checks the
              // tier server-side. This flag only controls what is DRAWN.
              isStaff
              endpoint="/api/property"
              onSaved={(saved) => saved && setProperty(saved)}
            />
          )}
        </div>
      )}
    </div>
  );
}
