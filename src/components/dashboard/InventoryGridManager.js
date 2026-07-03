"use client";

import { useState, useMemo } from "react";
import {
  Upload, Trash2, X, Plus, Copy, ChevronDown, ChevronRight, Search, Layers, Lock,
} from "lucide-react";
import PhotoUploader from "./PhotoUploader";
import { uploadPropertyPhoto } from "../../lib/storage";

const UNASSIGNED = "__unassigned__";
const MAX_BULK = 50;

// Stable-ish unique id for a new unit row.
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// mode: "owner" (default, full CRUD) or "operator" — the restricted view
// used by OperatorMode.js for delegated units (SCOUTIT_MASTER_BUILD_SPEC.md
// §9.2): operators can rename, re-photo, and set availability on their own
// delegated units, but never touch size/floor/features, and can't add,
// duplicate, or delete units — those stay owner-only. Kept as one shared
// component with a mode prop rather than a fork, per the locked plan
// decision, to avoid the two grids drifting apart.
export default function InventoryGridManager({ units = [], onChange, isPro, onAutoSave, mode = "owner" }) {
  const isOperatorMode = mode === "operator";
  const [activePhotoUnit, setActivePhotoUnit] = useState(null);
  const [uploadingUnitId, setUploadingUnitId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [search, setSearch] = useState("");
  const [collapsedFloors, setCollapsedFloors] = useState(() => new Set());
  const [bulkQty, setBulkQty] = useState(5);
  const [bulkFloor, setBulkFloor] = useState("");

  const maxPhotos = isPro ? 5 : 1;

  // ── Mutation helpers ──────────────────────────────────────────────
  // onChange = live local state. onAutoSave = commit a savepoint.
  // Typing only calls onChange (so keystrokes never trigger a save mid-edit);
  // structural changes + blur call commit() to persist.
  const commit = (newUnits) => {
    onChange(newUnits);
    onAutoSave(newUnits);
  };

  const makeUnit = (floor = "") => ({
    id: newId(),
    name: "",
    size: "",
    floor: floor || "",
    features: [],
    photos: [],
  });

  const addUnit = (floor = "") => commit([...units, makeUnit(floor)]);

  const bulkAdd = () => {
    const n = Math.max(1, Math.min(MAX_BULK, parseInt(bulkQty, 10) || 1));
    const batch = Array.from({ length: n }, () => makeUnit(bulkFloor.trim()));
    commit([...units, ...batch]);
    // Make sure the floor we just populated is expanded.
    if (bulkFloor.trim()) {
      setCollapsedFloors((prev) => {
        const next = new Set(prev);
        next.delete(bulkFloor.trim());
        return next;
      });
    }
  };

  const duplicateUnit = (id) => {
    const idx = units.findIndex((u) => u.id === id);
    if (idx === -1) return;
    const src = units[idx];
    const copy = {
      ...src,
      id: newId(),
      name: src.name ? `${src.name} (copy)` : "",
      features: [...(src.features || [])],
      photos: [], // photos don't carry over to a fresh unit
    };
    commit([...units.slice(0, idx + 1), copy, ...units.slice(idx + 1)]);
  };

  const removeUnit = (id) => {
    if (window.confirm("Delete this unit?")) {
      commit(units.filter((u) => u.id !== id));
    }
  };

  const updateUnit = (id, field, value, shouldSave = false) => {
    const newUnits = units.map((u) => (u.id === id ? { ...u, [field]: value } : u));
    onChange(newUnits);
    if (shouldSave) onAutoSave(newUnits);
  };

  const handleFeatureAdd = (id, rawValue) => {
    const val = (rawValue || "").trim();
    if (!val) return;
    const unit = units.find((u) => u.id === id);
    if (unit && !(unit.features || []).includes(val)) {
      commit(
        units.map((u) =>
          u.id === id ? { ...u, features: [...(u.features || []), val] } : u
        )
      );
    }
  };

  const removeFeature = (id, feature) => {
    commit(
      units.map((u) =>
        u.id === id ? { ...u, features: (u.features || []).filter((f) => f !== feature) } : u
      )
    );
  };

  const handleDirectDrop = async (e, id) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setUploadingUnitId(id);
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 10) + 5;
        return next >= 90 ? 90 : next;
      });
    }, 300);

    try {
      const url = await uploadPropertyPhoto(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        const unit = units.find((u) => u.id === id);
        const existing = unit?.photos || [];
        const allowed = existing.filter(Boolean).slice(0, maxPhotos);
        if (allowed.length >= maxPhotos) {
          setUploadingUnitId(null);
          return;
        }
        const newPhotos = [...existing, url];
        commit(
          units.map((u) =>
            u.id === id ? { ...u, photos: newPhotos, image: newPhotos.find(Boolean) || "" } : u
          )
        );
        setUploadingUnitId(null);
      }, 400);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Direct upload failed:", err);
      setUploadingUnitId(null);
    }
  };

  // ── Derived: search filter + floor grouping + counts ──────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return units;
    return units.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.floor ?? "").toString().toLowerCase().includes(q) ||
        (u.features || []).some((f) => f.toLowerCase().includes(q))
    );
  }, [units, search]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const u of filtered) {
      const key = (u.floor ?? "").toString().trim() || UNASSIGNED;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(u);
    }
    return [...map.entries()];
  }, [filtered]);

  const floorCount = useMemo(
    () => new Set(units.map((u) => (u.floor ?? "").toString().trim() || UNASSIGNED)).size,
    [units]
  );

  const toggleFloor = (key) =>
    setCollapsedFloors((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const floorLabel = (key) => (key === UNASSIGNED ? "Unassigned" : `Floor ${key}`);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 bg-[#121110] border border-surface-variant rounded-lg p-3">
        <div className="flex items-center gap-2 font-label-caps text-[10px] tracking-widest text-gold-accent uppercase shrink-0">
          <Layers size={14} />
          <span>{units.length} {units.length === 1 ? "unit" : "units"}</span>
          <span className="text-text-muted">·</span>
          <span>{floorCount} {floorCount === 1 ? "floor" : "floors"}</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 bg-surface-alt border border-surface-variant rounded px-3 py-1.5 focus-within:border-gold-accent transition-colors">
          <Search size={14} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, floor, or feature…"
            className="w-full bg-transparent text-sm text-text-primary focus:outline-none placeholder-text-muted/60"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-text-muted hover:text-gold-accent" title="Clear">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Bulk add — owner only, operators can't add units */}
        {!isOperatorMode && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-label-caps text-[9px] tracking-widest text-text-secondary uppercase hidden sm:block">Bulk add</span>
            <input
              type="number"
              min={1}
              max={MAX_BULK}
              value={bulkQty}
              onChange={(e) => setBulkQty(e.target.value)}
              className="w-14 bg-surface-alt border border-surface-variant rounded px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-gold-accent transition-colors"
              title="How many units"
            />
            <input
              type="text"
              value={bulkFloor}
              onChange={(e) => setBulkFloor(e.target.value)}
              placeholder="Floor"
              className="w-20 bg-surface-alt border border-surface-variant rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-gold-accent transition-colors"
              title="Optional floor for the batch"
            />
            <button
              onClick={bulkAdd}
              className="bg-gold-accent text-background font-working-title font-bold px-3 py-1.5 rounded text-sm hover:bg-gold-accent-hover transition-colors whitespace-nowrap"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {units.length === 0 ? (
        <div className="bg-[#121110] border border-surface-variant rounded-lg p-10 text-center">
          <p className="text-text-secondary text-sm italic mb-4">
            {isOperatorMode
              ? "No units have been delegated to you yet."
              : (<>No units yet. Add them one at a time, or use <span className="text-gold-accent">Bulk add</span> for buildings with many similar spaces.</>)}
          </p>
          {!isOperatorMode && (
            <button
              onClick={() => addUnit()}
              className="inline-flex items-center gap-2 border border-gold-accent text-gold-accent hover:bg-gold-accent/10 px-4 py-2 rounded text-sm font-working-title transition-colors"
            >
              <Plus size={16} /> Add your first unit
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#121110] border border-surface-variant rounded-lg p-8 text-center text-text-secondary text-sm italic">
          No units match “{search}”.
        </div>
      ) : (
        groups.map(([floorKey, floorUnits]) => {
          const collapsed = collapsedFloors.has(floorKey);
          return (
            <div key={floorKey} className="bg-[#121110] border border-surface-variant rounded-lg overflow-hidden">
              {/* Floor header */}
              <div className="flex items-center justify-between bg-surface-alt border-b border-surface-variant px-4 py-2.5">
                <button
                  onClick={() => toggleFloor(floorKey)}
                  className="flex items-center gap-2 text-gold-accent hover:text-gold-accent-hover transition-colors"
                >
                  {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  <span className="font-label-caps text-[11px] tracking-widest uppercase">{floorLabel(floorKey)}</span>
                  <span className="font-label-caps text-[10px] tracking-widest text-text-muted uppercase">
                    · {floorUnits.length} {floorUnits.length === 1 ? "unit" : "units"}
                  </span>
                </button>
                {!search && !isOperatorMode && (
                  <button
                    onClick={() => addUnit(floorKey === UNASSIGNED ? "" : floorKey)}
                    className="flex items-center gap-1 text-text-muted hover:text-gold-accent transition-colors text-xs font-working-title"
                    title="Add a unit to this floor"
                  >
                    <Plus size={14} /> Add here
                  </button>
                )}
              </div>

              {!collapsed && (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[820px]">
                    <thead>
                      <tr className="border-b border-surface-variant/60">
                        <th className="p-3 font-label-caps text-[10px] tracking-widest text-text-secondary uppercase w-[24%]">Unit Identifier</th>
                        <th className="p-3 font-label-caps text-[10px] tracking-widest text-text-secondary uppercase w-[12%]">Size (sqm)</th>
                        <th className="p-3 font-label-caps text-[10px] tracking-widest text-text-secondary uppercase w-[12%]">Floor</th>
                        <th className="p-3 font-label-caps text-[10px] tracking-widest text-text-secondary uppercase w-[34%]">Tags &amp; Features</th>
                        <th className="p-3 font-label-caps text-[10px] tracking-widest text-text-secondary uppercase text-center w-[10%]">Media</th>
                        {isOperatorMode && (
                          <th className="p-3 font-label-caps text-[10px] tracking-widest text-text-secondary uppercase w-[14%]">Availability</th>
                        )}
                        <th className="p-3 w-[8%]" />
                      </tr>
                    </thead>
                    <tbody>
                      {floorUnits.map((unit) => {
                        const photoCount = (unit.photos || []).filter(Boolean).length;
                        const atPhotoLimit = photoCount >= maxPhotos;
                        // Delegated units (§9.2) are pinned in the owner's grid — the
                        // owner's route silently ignores edits/deletes to these, so
                        // the grid must show that plainly rather than let the owner
                        // type into a field that quietly never saves. In operator
                        // mode every row IS the operator's own delegated unit, so we
                        // don't apply the "someone else's unit" lock treatment — but
                        // structural fields (size/floor/features) stay read-only
                        // there regardless, per spec §9.2.
                        const isDelegated = Boolean(unit.operatorId);
                        const lockedForOwner = isDelegated && !isOperatorMode;
                        const structuralReadOnly = isOperatorMode || lockedForOwner;
                        return (
                          <tr key={unit.id} className={`border-b border-surface-variant/40 transition-colors group ${lockedForOwner ? "bg-gold-accent/5" : "hover:bg-surface-variant/20"}`}>
                            {/* Name */}
                            <td className="p-2.5 align-top">
                              {lockedForOwner ? (
                                <div className="px-2 py-1">
                                  <div className="text-sm text-text-primary">{unit.name || "Unnamed unit"}</div>
                                  <div className="flex items-center gap-1 text-[10px] text-gold-accent font-label-caps tracking-wide uppercase mt-0.5">
                                    <Lock size={9} /> Operated by {unit.operatorDisplayName || "another party"}
                                  </div>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={unit.name || ""}
                                  onChange={(e) => updateUnit(unit.id, "name", e.target.value)}
                                  onBlur={(e) => updateUnit(unit.id, "name", e.target.value, true)}
                                  placeholder="e.g. Unit 12-A"
                                  className="w-full bg-transparent border border-transparent hover:border-surface-variant focus:border-gold-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none transition-colors"
                                />
                              )}
                            </td>
                            {/* Size */}
                            <td className="p-2.5 align-top">
                              {structuralReadOnly ? (
                                <span className="px-2 py-1 text-sm text-text-secondary block">{unit.size || "—"}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={unit.size || ""}
                                  onChange={(e) => updateUnit(unit.id, "size", e.target.value)}
                                  onBlur={(e) => updateUnit(unit.id, "size", e.target.value, true)}
                                  placeholder="30"
                                  className="w-full bg-transparent border border-transparent hover:border-surface-variant focus:border-gold-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none transition-colors"
                                />
                              )}
                            </td>
                            {/* Floor */}
                            <td className="p-2.5 align-top">
                              {structuralReadOnly ? (
                                <span className="px-2 py-1 text-sm text-text-secondary block">{unit.floor || "—"}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={unit.floor || ""}
                                  onChange={(e) => updateUnit(unit.id, "floor", e.target.value)}
                                  onBlur={(e) => updateUnit(unit.id, "floor", e.target.value, true)}
                                  placeholder="e.g. 3"
                                  className="w-full bg-transparent border border-transparent hover:border-surface-variant focus:border-gold-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none transition-colors"
                                />
                              )}
                            </td>
                            {/* Features */}
                            <td className="p-2.5 align-top">
                              {(unit.features || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {(unit.features || []).map((feature, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-surface-variant border border-gold-accent/20 text-[11px] text-text-primary rounded uppercase tracking-wide font-working-title">
                                      {feature}
                                      {!structuralReadOnly && (
                                        <button onClick={() => removeFeature(unit.id, feature)} className="text-text-muted hover:text-error transition-colors">
                                          <X size={10} />
                                        </button>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {!structuralReadOnly && (
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleFeatureAdd(unit.id, e.target.value);
                                        e.target.value = "";
                                      }
                                    }}
                                    placeholder="Type a feature & press Enter…"
                                    className="bg-transparent text-sm text-text-secondary focus:outline-none placeholder-text-muted/50 border-b border-surface-variant focus:border-gold-accent transition-colors flex-1"
                                  />
                                  <button
                                    onClick={(e) => {
                                      const input = e.currentTarget.previousElementSibling;
                                      if (input && input.value.trim() !== "") {
                                        handleFeatureAdd(unit.id, input.value);
                                        input.value = "";
                                      }
                                    }}
                                    className="text-text-muted hover:text-gold-accent transition-colors"
                                    title="Add feature"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                            {/* Media */}
                            <td
                              className={`p-2.5 align-top text-center transition-colors ${uploadingUnitId === unit.id ? "opacity-50" : ""}`}
                              onDragOver={(e) => !lockedForOwner && e.preventDefault()}
                              onDrop={(e) => !lockedForOwner && handleDirectDrop(e, unit.id)}
                            >
                              <button
                                onClick={() => !lockedForOwner && setActivePhotoUnit(unit.id)}
                                disabled={lockedForOwner}
                                className={`relative h-10 w-10 flex items-center justify-center rounded border ${photoCount > 0 ? "bg-gold-accent/20 border-gold-accent text-gold-accent" : "bg-surface-alt border-surface-variant text-text-muted hover:border-gold-accent hover:text-gold-accent"} transition-colors mx-auto disabled:opacity-40 disabled:cursor-not-allowed`}
                                title={lockedForOwner ? "Managed by the operator" : isPro ? "Upload photos" : "Free tier: 1 photo per unit"}
                              >
                                <Upload size={18} />
                              </button>
                              <div className="text-[10px] text-text-secondary mt-1 flex items-center justify-center gap-1">
                                {!isPro && atPhotoLimit && <Lock size={9} className="text-text-muted" />}
                                {photoCount}/{maxPhotos}
                              </div>
                              {uploadingUnitId === unit.id && (
                                <div className="mt-1 w-full max-w-[80px] mx-auto">
                                  <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                                    <div className="h-full bg-gold-accent transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                                  </div>
                                </div>
                              )}
                            </td>
                            {/* Availability — operator mode only */}
                            {isOperatorMode && (
                              <td className="p-2.5 align-top">
                                <select
                                  value={unit.availabilityStatus || "available"}
                                  onChange={(e) => updateUnit(unit.id, "availabilityStatus", e.target.value, true)}
                                  className="w-full bg-surface-alt border border-surface-variant rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-gold-accent transition-colors"
                                >
                                  <option value="available">Available</option>
                                  <option value="occupied">Occupied</option>
                                  <option value="coming_soon">Coming Soon</option>
                                </select>
                              </td>
                            )}
                            {/* Row actions — never available in operator mode or for delegated rows */}
                            <td className="p-2.5 align-top text-center whitespace-nowrap">
                              {!isOperatorMode && !lockedForOwner && (
                                <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => duplicateUnit(unit.id)}
                                    className="p-2 rounded hover:bg-gold-accent/10 text-text-muted hover:text-gold-accent transition-colors"
                                    title="Duplicate unit"
                                  >
                                    <Copy size={15} />
                                  </button>
                                  <button
                                    onClick={() => removeUnit(unit.id)}
                                    className="p-2 rounded hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                                    title="Delete unit"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Add single unit — owner only */}
      {units.length > 0 && !isOperatorMode && (
        <button
          onClick={() => addUnit()}
          className="self-start border border-gold-accent text-gold-accent hover:bg-gold-accent/10 px-4 py-2 flex items-center gap-2 rounded text-sm font-working-title transition-colors"
        >
          <Plus size={16} /> Add Unit
        </button>
      )}

      {/* Photo Uploader Modal */}
      {activePhotoUnit && (
        <div
          className="fixed inset-0 z-[3000] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          <div className="bg-[#121110] border border-gold-accent/30 rounded-lg p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display-md text-2xl text-gold-accent">Unit Media</h3>
              <button
                onClick={() => setActivePhotoUnit(null)}
                className="p-2 text-text-secondary hover:text-on-surface bg-surface-variant hover:bg-surface rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {(() => {
              const u = units.find((unit) => unit.id === activePhotoUnit);
              if (!u) return null;

              const photosArray = u.photos || (u.image ? [u.image] : Array(maxPhotos).fill(""));
              while (photosArray.length < maxPhotos) photosArray.push("");
              if (photosArray.length > maxPhotos) photosArray.length = maxPhotos;

              const handlePhotoChange = (newPhotos) => {
                commit(
                  units.map((un) =>
                    un.id === activePhotoUnit
                      ? { ...un, photos: newPhotos, image: newPhotos.find(Boolean) || "" }
                      : un
                  )
                );
              };

              return (
                <div>
                  <div className="mb-4">
                    <PhotoUploader
                      photos={photosArray}
                      onChange={handlePhotoChange}
                      isPro={isPro}
                      maxFreePhotos={maxPhotos}
                    />
                  </div>
                  {!isPro && (
                    <div className="mt-4 p-4 border border-gold-accent/20 bg-gold-accent/5 rounded-lg text-sm text-text-secondary">
                      <span className="text-gold-accent font-bold uppercase tracking-wide text-xs mb-1 block">Free Tier Limit</span>
                      You can add 1 photo per unit. Upgrade to unlock up to 5 photos per unit.
                    </div>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setActivePhotoUnit(null)}
                      className="bg-gold-accent text-background font-working-title font-bold px-6 py-2 rounded uppercase tracking-wider text-sm hover:bg-surface-tint transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
