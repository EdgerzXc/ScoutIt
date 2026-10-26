"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "@/components/ui/useModalDialog";
import { SPATIAL_SLA_HOURS } from "@/lib/spatialStudio";
import { Wrench, Clock, Check, AlertCircle, X } from "lucide-react";

const REVISION_ELEMENTS = [
  { id: "flooring", label: "Flooring & Baseboards" },
  { id: "partitions", label: "Partitions & Walls" },
  { id: "lighting", label: "Ceiling & Recessed Lighting" },
  { id: "furniture", label: "Fixed Millwork & Furniture Layout" },
  { id: "fenestration", label: "Glazing & Window Views" },
];

export default function SpatialStudioRevisionModal({
  isOpen,
  onClose,
  property,
  onSuccess,
}) {
  const modalRef = useRef(null);
  useModalDialog(modalRef, { active: isOpen, onClose });

  const [mounted, setMounted] = useState(false);
  const [selectedElements, setSelectedElements] = useState(["flooring"]);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const toggleElement = (id) => {
    setSelectedElements((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!revisionNotes || revisionNotes.trim().length < 5) {
      setErrorMsg("Please provide detailed instructions (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/spatial/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property?.id || property?.slug,
          revisionNotes: revisionNotes.trim(),
          targetElements: selectedElements,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit revision request");
      }

      onSuccess?.(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit revision");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spatial-revision-title"
        className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto text-text-primary"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[var(--accent)] font-bold flex items-center gap-1.5">
                <Wrench size={14} className="text-[var(--accent)]" />
                ScoutIt Spatial Studio
              </span>
              <span className="text-[12px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                <Clock size={12} />
                Express {SPATIAL_SLA_HOURS.express}h SLA
              </span>
            </div>
            <h2 id="spatial-revision-title" className="text-xl sm:text-2xl font-bold font-editorial text-text-primary">
              Request Studio Scene Tweak
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Bypasses the general backlog for <span className="text-[var(--accent-bright)] font-semibold">{property?.title || property?.name || "Selected Property"}</span> since base 3D scene geometry is already built.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary transition rounded-lg hover:bg-surface-alt"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Targeted Elements */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[12px] uppercase tracking-wider text-text-secondary font-semibold">
              Target Fit-Out Elements
            </label>
            <div className="flex flex-wrap gap-2">
              {REVISION_ELEMENTS.map((elem) => {
                const isSelected = selectedElements.includes(elem.id);
                return (
                  <button
                    key={elem.id}
                    type="button"
                    onClick={() => toggleElement(elem.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[12px] uppercase tracking-wider transition flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[var(--accent)] text-black font-bold shadow-sm"
                        : "bg-surface-alt text-text-secondary hover:text-text-primary border border-border"
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                    <span>{elem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Revision Notes */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[12px] uppercase tracking-wider text-text-secondary font-semibold">
              Detailed Revision Instructions
            </label>
            <textarea
              rows={4}
              required
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g. Please replace the bedroom oak flooring with herringbone walnut, and adjust the living room partition to frameless fluted glass."
              className="w-full rounded-xl bg-surface-alt border border-border px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[var(--accent)] transition resize-none"
            />
          </div>

          {/* SLA Notice */}
          <div className="p-3.5 rounded-xl bg-surface-alt border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--accent)]" />
              <span className="font-mono text-[12px] uppercase tracking-wider text-text-secondary">
                Turnaround SLA: <strong className="text-[var(--accent-bright)]">4 to 12 Hours</strong>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono text-[12px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
              Included
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary font-mono text-xs uppercase tracking-wider transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || revisionNotes.trim().length < 5}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black hover:bg-[var(--accent-bright)] disabled:opacity-40 disabled:cursor-not-allowed font-mono text-xs uppercase tracking-wider font-bold transition shadow-lg active:scale-95"
            >
              {isSubmitting ? "Queueing..." : "Submit Express Revision"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
