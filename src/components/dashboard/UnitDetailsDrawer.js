"use client";

import { useState } from "react";
import { X, Plus, Trash2, Star } from "lucide-react";
import { UNIT_TYPES, estimateCapacity } from "../../lib/unitMasterPage";

// Drill-in editor for one unit's Unit Master Page — the rich co-working fields
// (details) and the subdivision scenarios that power the "This space flexes"
// toggle. Opened from the inventory grid. The bulk grid stays for name/size/
// floor/photos at scale; this is where the depth lives (mirrors how
// LiveEditorWorkspace edits a whole property).
//
// Saving: every change calls onDetail/onScenarios, which route through the
// grid's updateUnit(..., shouldSave=true) → the page's 1s-debounced autosave.
// No explicit save button needed.

const newScenarioId = () => "sc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

const inputCls =
  "w-full bg-surface-alt border border-surface-variant rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-gold-accent transition-colors";
const labelCls = "block text-[11px] font-label-caps tracking-widest uppercase text-text-secondary mb-1.5";

function Field({ label, hint, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

export default function UnitDetailsDrawer({ unit, isPro, onDetail, onScenarios, onClose }) {
  const d = unit.details || {};
  const scenarios = Array.isArray(unit.subdivisionScenarios) ? unit.subdivisionScenarios : [];
  const [inclusionsText, setInclusionsText] = useState(
    Array.isArray(d.lease_inclusions) ? d.lease_inclusions.join(", ") : ""
  );

  const capEstimate = estimateCapacity(unit.size);

  const commitInclusions = (text) => {
    const arr = text.split(",").map((s) => s.trim()).filter(Boolean);
    onDetail("lease_inclusions", arr);
  };

  const addScenario = () => {
    onScenarios([
      ...scenarios,
      { id: newScenarioId(), label: "", cuts: "", sqm_each: "", capacity_each: "", price_each: "", recommended: false, floor_plan_2d_url: "" },
    ]);
  };
  const updateScenario = (id, key, value) => {
    onScenarios(scenarios.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };
  const removeScenario = (id) => {
    onScenarios(scenarios.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[1100] flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[560px] h-full overflow-y-auto bg-background border-l border-surface-variant shadow-2xl animate-[slideInRight_0.25s_ease-out]">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur border-b border-surface-variant">
          <div>
            <div className="text-[10px] font-label-caps tracking-widest uppercase text-gold-accent">Unit Master Page</div>
            <h2 className="font-display-md text-lg text-on-surface">{unit.name || "Untitled Unit"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-surface-alt text-text-muted hover:text-on-surface transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* Overview */}
          <section className="flex flex-col gap-4">
            <div className="text-[11px] font-label-caps tracking-widest uppercase text-text-secondary">The Space</div>
            <Field label="Unit type">
              <select className={inputCls} value={d.unit_type || ""} onChange={(e) => onDetail("unit_type", e.target.value)}>
                <option value="">Select type…</option>
                {UNIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Capacity (seats)"
              hint={capEstimate ? `Leave blank to auto-estimate ~${capEstimate} from size. Fill to override.` : "Add a unit size to auto-estimate, or set an explicit seat count."}
            >
              <input type="number" min="0" className={inputCls} value={d.capacity_seats ?? ""} onChange={(e) => onDetail("capacity_seats", e.target.value)} placeholder={capEstimate ? `~${capEstimate}` : "e.g. 40"} />
            </Field>
            <Field label="Differentiator" hint="Why this specific cut — corner suite, freight-lift access, private entrance…">
              <textarea rows={3} className={inputCls} value={d.differentiator || ""} onChange={(e) => onDetail("differentiator", e.target.value)} placeholder="Corner suite with uninterrupted skyline views and a private pantry." />
            </Field>
            <Field label="Fit-out status">
              <input className={inputCls} value={d.fit_out_status || ""} onChange={(e) => onDetail("fit_out_status", e.target.value)} placeholder="Warm shell / Fully fitted / Plug-and-play" />
            </Field>
          </section>

          {/* Terms & Fit-Out */}
          <section className="flex flex-col gap-4 pt-2 border-t border-surface-variant">
            <div className="text-[11px] font-label-caps tracking-widest uppercase text-text-secondary">Terms & Fit-Out</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Operating hours">
                <input className={inputCls} value={d.operating_hours || ""} onChange={(e) => onDetail("operating_hours", e.target.value)} placeholder="24/7 / 8am–9pm" />
              </Field>
              <Field label="Minimum term">
                <input className={inputCls} value={d.min_term || ""} onChange={(e) => onDetail("min_term", e.target.value)} placeholder="6 months" />
              </Field>
              <Field label="Deposit">
                <input className={inputCls} value={d.deposit || ""} onChange={(e) => onDetail("deposit", e.target.value)} placeholder="2 months" />
              </Field>
            </div>
            <Field label="What's included" hint="Comma-separated — Internet, Utilities, Furniture, Meeting-room credits…">
              <input className={inputCls} value={inclusionsText} onChange={(e) => { setInclusionsText(e.target.value); commitInclusions(e.target.value); }} placeholder="Internet, Utilities, Furniture, 10 meeting-room hrs/mo" />
            </Field>
            <Field label="House rules / fit-out rules">
              <textarea rows={2} className={inputCls} value={d.house_rules || ""} onChange={(e) => onDetail("house_rules", e.target.value)} placeholder="No structural changes; landlord approval for signage." />
            </Field>
          </section>

          {/* Floor plan */}
          <section className="flex flex-col gap-4 pt-2 border-t border-surface-variant">
            <div className="text-[11px] font-label-caps tracking-widest uppercase text-text-secondary">The Unit Vault</div>
            <Field label="2D floor plan URL" hint="Uploaded blueprint. The 3D interactive plan is generated from this (Cluster+ tenants see it in the Vault).">
              <input className={inputCls} value={d.floor_plan_2d_url || ""} onChange={(e) => onDetail("floor_plan_2d_url", e.target.value)} placeholder="https://…/floor-12.png" />
            </Field>
            <p className="text-[11px] text-text-muted -mt-1">
              3D conversion is generated on our side and shown gated behind Cluster+ — no Connect cost. A commissioned pro model is a separate paid ecosystem service.
            </p>
          </section>

          {/* Subdivision scenarios */}
          <section className="flex flex-col gap-3 pt-2 border-t border-surface-variant">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-label-caps tracking-widest uppercase text-text-secondary">This space flexes — subdivision options</div>
            </div>
            <p className="text-[11px] text-text-muted -mt-1">
              Curate the real ways this space can be carved. Buyers pick from these on the unit page (they don&apos;t invent cuts). Add a &ldquo;Whole floor&rdquo;, &ldquo;Halves&rdquo;, &ldquo;Quarters&rdquo;, etc.
            </p>

            {scenarios.length === 0 && (
              <div className="text-xs text-text-muted italic bg-surface-alt border border-surface-variant rounded px-3 py-3">
                No configurations yet. This unit is offered as-is.
              </div>
            )}

            {scenarios.map((s) => {
              const scCap = estimateCapacity(s.sqm_each);
              return (
                <div key={s.id} className="bg-surface-alt border border-surface-variant rounded-lg p-3 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input className={`${inputCls} flex-1`} value={s.label || ""} onChange={(e) => updateScenario(s.id, "label", e.target.value)} placeholder="Layout name — e.g. Quarters" />
                    <button
                      onClick={() => updateScenario(s.id, "recommended", !s.recommended)}
                      title="Mark recommended"
                      className={`p-2 rounded border transition-colors ${s.recommended ? "border-gold-accent text-gold-accent bg-gold-accent/10" : "border-surface-variant text-text-muted hover:text-gold-accent"}`}
                    >
                      <Star size={15} fill={s.recommended ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => removeScenario(s.id)} title="Remove" className="p-2 rounded border border-surface-variant text-text-muted hover:text-error hover:border-error transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} value={s.cuts ?? ""} onChange={(e) => updateScenario(s.id, "cuts", e.target.value)} placeholder="# of cuts (e.g. 4)" />
                    <input className={inputCls} value={s.sqm_each ?? ""} onChange={(e) => updateScenario(s.id, "sqm_each", e.target.value)} placeholder="sqm each (e.g. 500)" />
                    <input className={inputCls} value={s.capacity_each ?? ""} onChange={(e) => updateScenario(s.id, "capacity_each", e.target.value)} placeholder={scCap ? `~${scCap} seats (auto)` : "seats each"} />
                    <input className={inputCls} value={s.price_each ?? ""} onChange={(e) => updateScenario(s.id, "price_each", e.target.value)} placeholder="rate each (e.g. ₱X/mo)" />
                  </div>
                  <input className={inputCls} value={s.floor_plan_2d_url || ""} onChange={(e) => updateScenario(s.id, "floor_plan_2d_url", e.target.value)} placeholder="Floor plan URL for this layout (optional)" />
                </div>
              );
            })}

            <button onClick={addScenario} className="flex items-center justify-center gap-2 w-full py-2.5 rounded border border-dashed border-surface-variant text-text-secondary hover:border-gold-accent hover:text-gold-accent transition-colors text-sm">
              <Plus size={15} /> Add a subdivision option
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
