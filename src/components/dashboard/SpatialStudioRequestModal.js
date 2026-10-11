"use client";

import { useState, useRef } from "react";
import { useModalDialog } from "@/components/ui/useModalDialog";
import {
  SPATIAL_STYLE_PRESETS,
  resolveSpatialEntitlement,
  SPATIAL_SLA_HOURS,
} from "@/lib/spatialStudio";
import { Sparkles, Upload, Check, AlertCircle, X } from "lucide-react";

export default function SpatialStudioRequestModal({
  isOpen,
  onClose,
  property,
  currentTier = "starry",
  currentConnects = 0,
  monthlyGenerationsUsed = 0,
  onSuccess,
}) {
  const modalRef = useRef(null);
  useModalDialog(modalRef, { active: isOpen, onClose });

  const [selectedPreset, setSelectedPreset] = useState("minimalist_organic");
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const entitlement = resolveSpatialEntitlement({
    tier: currentTier,
    monthlyGenerationsUsed,
    currentConnects,
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entitlement.canProceed) {
      setErrorMsg(entitlement.reason);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/spatial/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property?.id || property?.slug,
          stylePreset: selectedPreset,
          notes,
          fileUrl: selectedFile ? selectedFile.name : null,
          walletConnects: currentConnects,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit generation request");
      }

      onSuccess?.(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spatial-modal-title"
        className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto text-text-primary"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[var(--accent)] font-bold flex items-center gap-1.5">
                <Sparkles size={14} className="text-[var(--accent)]" />
                ScoutIt Spatial Studio
              </span>
              <span className="text-[12px] font-mono uppercase tracking-wider text-text-muted">
                · 24–48h SLA
              </span>
            </div>
            <h2 id="spatial-modal-title" className="text-xl sm:text-2xl font-bold font-editorial text-text-primary">
              Generate 3D Spatial Twin
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Target Property: <span className="text-[var(--accent-bright)] font-semibold">{property?.title || property?.name || "Selected Property"}</span>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Pillar 1: Pre-Flight Style & Palette Selector */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[12px] uppercase tracking-wider text-text-secondary font-semibold">
                1. Select Aesthetic Moodboard Preset
              </label>
              <span className="text-[12px] font-mono text-[var(--accent)]">
                Required for 1st-Time Accuracy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(SPATIAL_STYLE_PRESETS).map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`text-left p-4 rounded-xl border transition flex flex-col justify-between gap-3 relative ${
                      isSelected
                        ? "bg-surface-alt border-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]"
                        : "bg-surface-variant/40 border-border hover:border-border-subtle"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--accent)] text-black flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs uppercase tracking-wide font-bold text-text-primary">
                        {preset.name}
                      </span>
                      <span className="text-[12px] text-text-muted leading-tight">
                        {preset.subtitle}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                      <span className="text-[12px] font-mono text-[var(--accent-bright)]">
                        {preset.materials.slice(0, 2).join(" · ")}
                      </span>
                      <span className="text-[12px] text-text-muted truncate">
                        {preset.lighting}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blueprint CAD or Video Upload */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[12px] uppercase tracking-wider text-text-secondary font-semibold">
              2. Upload Blueprint CAD / Walkthrough Video
            </label>
            <div className="relative border-2 border-dashed border-border hover:border-[var(--accent)]/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-surface-alt/30 transition text-center cursor-pointer">
              <input
                type="file"
                accept=".pdf,.dwg,.mp4,.mov"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload size={24} className="text-[var(--accent)] mb-1" />
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs text-[var(--accent-bright)] font-bold">
                    {selectedFile.name}
                  </span>
                  <span className="text-[12px] text-text-muted">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for studio intake
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-text-primary font-medium">
                    Drag and drop your CAD PDF or walkthrough video
                  </span>
                  <span className="text-[12px] text-text-muted mt-0.5">
                    Accepted: .pdf, .dwg, .mp4, .mov
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[12px] uppercase tracking-wider text-text-secondary font-semibold">
              3. Architectural & Fit-Out Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on kitchen island fluted glass, 3.2m ceiling clearance, retain balcony orientation..."
              className="w-full rounded-xl bg-surface-alt border border-border px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[var(--accent)] transition resize-none"
            />
          </div>

          {/* Entitlement & Allowance Badge */}
          <div className="p-4 rounded-xl bg-surface-alt border border-border flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[12px] uppercase tracking-wider text-text-secondary font-semibold">
                Subscription Entitlement
              </span>
              <p className="text-xs text-text-muted">
                {entitlement.reason}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              {entitlement.coveredByTier ? (
                <span className="px-2.5 py-1 rounded-full font-mono text-[12px] uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  Covered by Plan
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full font-mono text-[12px] uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-[var(--accent-bright)] font-bold">
                  3 Connects (~₱60)
                </span>
              )}
            </div>
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
              disabled={isSubmitting || !entitlement.canProceed}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black hover:bg-[var(--accent-bright)] disabled:opacity-40 disabled:cursor-not-allowed font-mono text-xs uppercase tracking-wider font-bold transition shadow-lg active:scale-95"
            >
              {isSubmitting ? "Queueing..." : `Queue for 3D Generation (${SPATIAL_SLA_HOURS.standard}h SLA)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
