"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, 
  Sparkles, 
  Check, 
  RotateCcw, 
  X, 
  Building2, 
  UploadCloud
} from "lucide-react";
import { 
  SYNONYM_MAP, 
  FIELD_LABELS, 
  formatPhp, 
  parseShorthandNumber, 
  matchFieldFromQuery,
  parseHeuristicUpdates
} from "@/lib/propertyUpdateParser";
import { sanitizeError } from "@/lib/sanitizeError";

export default function PropertyUpdateHub({ 
  listings = [], 
  onUpdateListing, 
  onSaveUnits,
  addToast
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("auto"); // "auto" | "paste" | "queue"
  const [undoStack, setUndoStack] = useState(null); // { id, type, propertyId, field, previousValue, expiresAt }
  const [savingId, setSavingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [loadedUnitsByProp, setLoadedUnitsByProp] = useState({});

  // Tier 2: Paste / Chat Copilot State
  const [pastedText, setPastedText] = useState("");
  const [isParsingIntent, setIsParsingIntent] = useState(false);
  const [proposedUpdates, setProposedUpdates] = useState([]);
  const [isApplyingUpdates, setIsApplyingUpdates] = useState(false);

  // Tier 3: Queue State
  const [isUploadingQueue, setIsUploadingQueue] = useState(false);
  const [queueInfo, setQueueInfo] = useState(null); // { queueNumber, propertyId, status }
  const fileInputRef = useRef(null);

  // Fetch real property_units rows for accurate unit-level searching
  useEffect(() => {
    let isMounted = true;
    async function loadUnits() {
      for (const p of listings) {
        if (!p.id) continue;
        try {
          const res = await fetch(`/api/dashboard/units?propertyId=${p.id}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && Array.isArray(data.units)) {
              setLoadedUnitsByProp(prev => ({ ...prev, [p.id]: data.units }));
            }
          }
        } catch {
          // Non-blocking unit fetch
        }
      }
    }
    if (listings.length > 0) {
      loadUnits();
    }
    return () => { isMounted = false; };
  }, [listings]);

  // Undo expiration timer (10 seconds)
  useEffect(() => {
    if (!undoStack) return;
    const timer = setTimeout(() => {
      setUndoStack(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [undoStack]);

  // Clean, memoized property summary list for matching
  const propertiesList = useMemo(() => {
    return listings.map(l => ({
      id: l.id,
      title: l.title || "Untitled Property",
      location: l.location || "",
      price: l.price || l.details?.price || 0,
      parking: l.parking || l.details?.parking_slots || l.details?.parking || 0,
      contact: l.details?.contact_number || l.contactNumber || "",
      status: l.pipelineStatus || "published",
      units: loadedUnitsByProp[l.id] || l.units || l.details?.units_inventory || []
    }));
  }, [listings, loadedUnitsByProp]);

  // Detect mode based on query input (Auto-adaptation for pasted text)
  useEffect(() => {
    if (query.includes("\n") || query.length > 60) {
      setActiveTab("paste");
      setPastedText(query);
    }
  }, [query]);

  // Tier 1: Search & Filter Matching Logic
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();

    const matchedField = matchFieldFromQuery(q);
    const results = [];

    propertiesList.forEach(prop => {
      const propMatches = prop.title.toLowerCase().includes(q) || prop.location.toLowerCase().includes(q);

      // 1. Matched a specific field (e.g. "rent", "parking", "status")
      if (matchedField) {
        let currentVal = "";
        let inputType = "text";
        if (matchedField === "price_php") {
          currentVal = prop.price;
          inputType = "currency";
        } else if (matchedField === "parking_slots") {
          currentVal = prop.parking;
          inputType = "number";
        } else if (matchedField === "contact_number") {
          currentVal = prop.contact;
          inputType = "tel";
        } else if (matchedField === "status") {
          currentVal = prop.status;
          inputType = "select";
        }

        results.push({
          id: `prop_${prop.id}_${matchedField}`,
          propertyId: prop.id,
          propertyTitle: prop.title,
          field: matchedField,
          fieldLabel: FIELD_LABELS[matchedField] || matchedField,
          currentValue: currentVal,
          inputType,
          type: "property"
        });
      }

      // 2. Matched unit number or property title
      if (propMatches || q.match(/\b([0-9]{2,4}[A-Za-z]?|[A-Za-z]-[0-9]+)\b/)) {
        if (Array.isArray(prop.units) && prop.units.length > 0) {
          prop.units.forEach(u => {
            const uName = u.name || u.unitNumber || "";
            if (uName.toLowerCase().includes(q) || propMatches) {
              // Add rent editor for this unit
              results.push({
                id: `unit_${prop.id}_${u.id || uName}_price`,
                propertyId: prop.id,
                propertyTitle: prop.title,
                unitId: u.id,
                unitName: uName,
                field: "unit_price",
                fieldLabel: `Unit ${uName} Rent`,
                currentValue: u.price || u.rent || prop.price,
                inputType: "currency",
                type: "unit"
              });

              // Add status editor for this unit if query mentions status or is a direct unit search
              if (matchedField === "status" || q.includes(uName.toLowerCase())) {
                results.push({
                  id: `unit_${prop.id}_${u.id || uName}_status`,
                  propertyId: prop.id,
                  propertyTitle: prop.title,
                  unitId: u.id,
                  unitName: uName,
                  field: "unit_status",
                  fieldLabel: `Unit ${uName} Status`,
                  currentValue: u.availabilityStatus || u.status || "available",
                  inputType: "select",
                  type: "unit"
                });
              }
            }
          });
        } else if (propMatches && !matchedField) {
          // General property card match
          results.push({
            id: `prop_general_${prop.id}`,
            propertyId: prop.id,
            propertyTitle: prop.title,
            field: "price_php",
            fieldLabel: FIELD_LABELS.price_php,
            currentValue: prop.price,
            inputType: "currency",
            type: "property"
          });
        }
      }
    });

    return results.slice(0, 10); // Top 10 most relevant
  }, [query, propertiesList]);

  // Handle Quick Pill Click
  const handleQuickPill = (fieldKey) => {
    setActiveTab("auto");
    setQuery(SYNONYM_MAP[fieldKey]?.[0] || fieldKey);
  };

  // Tier 1: Save Single Field Change
  const handleSaveField = async (item) => {
    const rawVal = editValues[item.id] !== undefined ? editValues[item.id] : item.currentValue;
    setSavingId(item.id);

    try {
      let finalVal = rawVal;
      if (item.inputType === "currency" || item.inputType === "number") {
        finalVal = parseShorthandNumber(rawVal);
        if (finalVal == null) throw new Error("Please enter a valid number");
      }

      const listing = listings.find(l => l.id === item.propertyId);
      if (!listing) throw new Error("Property not found");

      if (item.type === "property") {
        const updatedDetails = { ...(listing.details || {}) };
        if (item.field === "price_php") {
          updatedDetails.price = finalVal;
        } else if (item.field === "parking_slots") {
          updatedDetails.parking_slots = finalVal;
          updatedDetails.parking = finalVal;
        } else if (item.field === "contact_number") {
          updatedDetails.contact_number = finalVal;
        } else if (item.field === "status") {
          updatedDetails.status = finalVal;
        }

        if (onUpdateListing) {
          await onUpdateListing(item.propertyId, { details: updatedDetails });
        }
      } else if (item.type === "unit" && onSaveUnits) {
        // Unit update
        const existingUnits = loadedUnitsByProp[item.propertyId] || listing.units || listing.details?.units_inventory || [];
        const normalizedAvail = finalVal === "pending" ? "coming_soon" : (finalVal === "occupied" ? "occupied" : "available");
        
        const updatedUnits = existingUnits.map(u => {
          const isTarget = u.id === item.unitId || (u.name && u.name === item.unitName) || (u.unitNumber && u.unitNumber === item.unitName);
          if (isTarget) {
            if (item.field === "unit_status") {
              return { ...u, availabilityStatus: normalizedAvail, status: finalVal };
            }
            return { ...u, price: finalVal, rent: finalVal };
          }
          return u;
        });

        await onSaveUnits(item.propertyId, updatedUnits);
        setLoadedUnitsByProp(prev => ({ ...prev, [item.propertyId]: updatedUnits }));
      }

      // Record in undo stack
      setUndoStack({
        id: item.id,
        type: item.type,
        propertyId: item.propertyId,
        unitId: item.unitId,
        field: item.field,
        previousValue: item.currentValue,
        newValue: finalVal,
        label: item.fieldLabel
      });

      addToast?.(`Updated ${item.fieldLabel} successfully`, "✓");
    } catch (err) {
      addToast?.(sanitizeError(err, "Failed to update property"), "⚠️");
    } finally {
      setSavingId(null);
    }
  };

  // Tier 1: Undo Last Change
  const handleUndo = async () => {
    if (!undoStack) return;
    const { propertyId, field, previousValue, type, unitId, label } = undoStack;
    try {
      const listing = listings.find(l => l.id === propertyId);
      if (!listing) return;

      if (type === "property" && onUpdateListing) {
        const details = { ...(listing.details || {}) };
        if (field === "price_php") details.price = previousValue;
        if (field === "parking_slots") details.parking_slots = previousValue;
        if (field === "contact_number") details.contact_number = previousValue;
        if (field === "status") details.status = previousValue;
        await onUpdateListing(propertyId, { details });
      } else if (type === "unit" && onSaveUnits) {
        const existingUnits = loadedUnitsByProp[propertyId] || listing.units || listing.details?.units_inventory || [];
        const revertedUnits = existingUnits.map(u => {
          if (u.id === unitId) {
            if (field === "unit_status") {
              return { ...u, availabilityStatus: previousValue, status: previousValue };
            }
            return { ...u, price: previousValue, rent: previousValue };
          }
          return u;
        });
        await onSaveUnits(propertyId, revertedUnits);
        setLoadedUnitsByProp(prev => ({ ...prev, [propertyId]: revertedUnits }));
      }

      setUndoStack(null);
      addToast?.(`Reverted ${label} to ${previousValue}`, "↩");
    } catch (err) {
      addToast?.("Failed to undo change", "⚠️");
    }
  };

  // Tier 2: Parse Pasted Text / Viber Chat
  const handleParseIntent = async () => {
    if (!pastedText.trim()) return;
    setIsParsingIntent(true);
    setProposedUpdates([]);

    try {
      const res = await fetch("/api/properties/updates/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pastedText,
          properties: propertiesList
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse notes");

      if (data.updates && data.updates.length > 0) {
        setProposedUpdates(data.updates);
        addToast?.(`Detected ${data.updates.length} updates from notes`, "📋");
      } else {
        const localParsed = parseHeuristicUpdates(pastedText, propertiesList);
        setProposedUpdates(localParsed);
        if (localParsed.length > 0) {
          addToast?.(`Extracted ${localParsed.length} updates from notes`, "📋");
        } else {
          addToast?.("No clear property or unit updates detected. Please check wording.", "ℹ️");
        }
      }
    } catch (err) {
      const localParsed = parseHeuristicUpdates(pastedText, propertiesList);
      setProposedUpdates(localParsed);
      if (localParsed.length > 0) {
        addToast?.(`Parsed ${localParsed.length} updates locally`, "📋");
      } else {
        addToast?.(sanitizeError(err, "Failed to parse updates"), "⚠️");
      }
    } finally {
      setIsParsingIntent(false);
    }
  };

  // Tier 2: Approve & Apply All Updates (Distinguishes Unit vs Property updates)
  const handleApproveBatch = async () => {
    if (proposedUpdates.length === 0) return;
    setIsApplyingUpdates(true);

    let successCount = 0;
    try {
      // Group updates by target property
      const updatesByProp = {};
      for (const update of proposedUpdates) {
        const targetPropId = update.propertyId || (propertiesList.length === 1 ? propertiesList[0].id : null);
        if (!targetPropId) continue;
        if (!updatesByProp[targetPropId]) updatesByProp[targetPropId] = [];
        updatesByProp[targetPropId].push(update);
      }

      for (const [propId, propUpdates] of Object.entries(updatesByProp)) {
        const listing = listings.find(l => l.id === propId);
        if (!listing) continue;

        let detailsChanged = false;
        const details = { ...(listing.details || {}) };
        let units = [...(loadedUnitsByProp[propId] || listing.units || listing.details?.units_inventory || [])];
        let unitsChanged = false;

        for (const u of propUpdates) {
          if (u.unitIdentifier) {
            // Unit-level update
            const normAvail = u.newValue === "pending" ? "coming_soon" : (u.newValue === "occupied" ? "occupied" : "available");
            units = units.map(unit => {
              const uName = unit.name || unit.unitNumber || "";
              if (uName.toLowerCase().includes(u.unitIdentifier.toLowerCase())) {
                unitsChanged = true;
                if (u.field === "status") {
                  return { ...unit, availabilityStatus: normAvail, status: u.newValue };
                }
                return { ...unit, price: u.newValue, rent: u.newValue };
              }
              return unit;
            });
            successCount++;
          } else {
            // Property-level update
            detailsChanged = true;
            if (u.field === "price_php") details.price = u.newValue;
            if (u.field === "status") details.status = u.newValue;
            if (u.field === "parking_slots") details.parking_slots = u.newValue;
            if (u.field === "contact_number") details.contact_number = u.newValue;
            successCount++;
          }
        }

        if (detailsChanged && onUpdateListing) {
          await onUpdateListing(propId, { details }, { silent: true });
        }
        if (unitsChanged && onSaveUnits) {
          await onSaveUnits(propId, units);
          setLoadedUnitsByProp(prev => ({ ...prev, [propId]: units }));
        }
      }

      addToast?.(`Successfully applied ${successCount} updates across your properties`, "✓");
      setProposedUpdates([]);
      setPastedText("");
      setQuery("");
      setActiveTab("auto");
    } catch (err) {
      addToast?.(sanitizeError(err, "Batch update encountered an issue"), "⚠️");
    } finally {
      setIsApplyingUpdates(false);
    }
  };

  // Tier 3: Drop / Upload PDF into Single-Use Queue
  const handleQueueUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      addToast?.("Please upload a valid PDF document.", "⚠️");
      return;
    }

    setIsUploadingQueue(true);
    setQueueInfo(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

      const res = await fetch("/api/properties/queue/intake", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to queue document");

      setQueueInfo({
        queueNumber: data.queueNumber || 1,
        propertyId: data.property?.id,
        filename: file.name,
        status: "queued"
      });

      addToast?.(`Document Queued · You are #${data.queueNumber} in line`, "📬");

      // Trigger asynchronous background parsing immediately
      fetch("/api/properties/queue/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: data.property?.id })
      }).catch(err => console.warn("Background trigger dispatch:", err));

    } catch (err) {
      addToast?.(sanitizeError(err, "Failed to submit document to queue"), "⚠️");
    } finally {
      setIsUploadingQueue(false);
    }
  };

  return (
    <div className="w-full bg-surface/50 backdrop-blur-xl border border-white/[0.08] hover:border-gold-accent/30 rounded-2xl p-4 sm:p-5 mb-8 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      
      {/* Header bar: Brand Eyebrow + Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
          <span className="text-[12px] font-mono tracking-widest uppercase text-gold-accent font-bold">
            Property Update Hub
          </span>
          <span className="text-[12px] text-text-muted hidden sm:inline">
            · Search, Paste Notes, or Queue
          </span>
        </div>

        {/* 3 Hybrid Mode Switchers */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/[0.05] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("auto")}
            className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all min-h-[32px] ${
              activeTab === "auto" 
                ? "bg-gold-accent text-background font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]" 
                : "text-text-secondary hover:text-on-surface"
            }`}
          >
            ⚡ Quick Tweak
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all min-h-[32px] ${
              activeTab === "paste" 
                ? "bg-gold-accent text-background font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]" 
                : "text-text-secondary hover:text-on-surface"
            }`}
          >
            📋 Paste Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all min-h-[32px] ${
              activeTab === "queue" 
                ? "bg-gold-accent text-background font-bold shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]" 
                : "text-text-secondary hover:text-on-surface"
            }`}
          >
            📬 Drop PDF
          </button>
        </div>
      </div>

      {/* Undo Toast Notification Bar */}
      {undoStack && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-gold-accent/15 border border-gold-accent/30 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-gold-accent" />
            <span className="text-xs text-on-surface font-mono">
              Updated {undoStack.label}. Made a mistake?
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-gold-accent text-background text-xs font-mono uppercase font-bold hover:bg-gold-bright transition-all"
          >
            <RotateCcw size={12} /> Undo
          </button>
        </div>
      )}

      {/* ══ TIER 1: SEMI-AUTOMATIC (INSTANT SEARCH & INLINE EDIT) ══ */}
      {activeTab === "auto" && (
        <div className="flex flex-col gap-3">
          {/* Main Command Input */}
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 text-gold-accent/70 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "1201 rent 45k", "parking", "vacant", or a unit number...'
              className="w-full bg-black/60 border border-white/[0.12] focus:border-gold-accent rounded-xl pl-11 pr-10 py-3.5 text-base md:text-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold-accent transition-all min-h-[48px]"
            />
            {query && (
              <button 
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 p-1.5 text-text-muted hover:text-on-surface transition-colors"
                aria-label="Clear input"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Action Shortcut Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
            <span className="text-text-muted text-[12px] font-mono uppercase shrink-0">Quick Tweaks:</span>
            <button
              type="button"
              onClick={() => handleQuickPill("price_php")}
              className="px-2.5 py-1 rounded-full bg-surface-alt border border-white/[0.06] hover:border-gold-accent/40 text-text-secondary hover:text-gold-accent font-mono shrink-0 transition-all min-h-[30px]"
            >
              🏷️ Rent / Price
            </button>
            <button
              type="button"
              onClick={() => handleQuickPill("status")}
              className="px-2.5 py-1 rounded-full bg-surface-alt border border-white/[0.06] hover:border-gold-accent/40 text-text-secondary hover:text-gold-accent font-mono shrink-0 transition-all min-h-[30px]"
            >
              🟢 Availability
            </button>
            <button
              type="button"
              onClick={() => handleQuickPill("parking_slots")}
              className="px-2.5 py-1 rounded-full bg-surface-alt border border-white/[0.06] hover:border-gold-accent/40 text-text-secondary hover:text-gold-accent font-mono shrink-0 transition-all min-h-[30px]"
            >
              🚗 Parking
            </button>
            <button
              type="button"
              onClick={() => handleQuickPill("contact_number")}
              className="px-2.5 py-1 rounded-full bg-surface-alt border border-white/[0.06] hover:border-gold-accent/40 text-text-secondary hover:text-gold-accent font-mono shrink-0 transition-all min-h-[30px]"
            >
              📞 Phone
            </button>
          </div>

          {/* Search Result Matches (Direct Inline Editors) */}
          {query.trim() && searchResults.length > 0 && (
            <div className="mt-2 flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              <span className="text-[12px] font-mono uppercase tracking-wider text-text-muted">
                Matching Inventory ({searchResults.length}):
              </span>
              {searchResults.map(item => {
                const currentEditVal = editValues[item.id] !== undefined ? editValues[item.id] : item.currentValue;
                const isSaving = savingId === item.id;

                return (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-xl bg-surface-alt/70 border border-white/[0.06] hover:border-gold-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gold-accent shrink-0" />
                        <span className="text-sm font-working-title text-on-surface font-bold truncate">
                          {item.propertyTitle} {item.unitName ? `· Unit ${item.unitName}` : ""}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary font-mono">
                        {item.fieldLabel}: currently{" "}
                        <strong className="text-gold-bright">
                          {item.inputType === "currency" ? formatPhp(item.currentValue) : String(item.currentValue)}
                        </strong>
                      </span>
                    </div>

                    {/* Inline Edit Inputs */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.inputType === "select" ? (
                        <select
                          value={currentEditVal}
                          onChange={(e) => setEditValues({ ...editValues, [item.id]: e.target.value })}
                          className="bg-black/80 border border-surface-variant rounded-lg px-3 py-1.5 text-xs text-on-surface font-mono focus:border-gold-accent focus:outline-none min-h-[40px]"
                        >
                          <option value="available">AVAILABLE</option>
                          <option value="occupied">OCCUPIED</option>
                          <option value="pending">PENDING</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={currentEditVal}
                          onChange={(e) => setEditValues({ ...editValues, [item.id]: e.target.value })}
                          placeholder="e.g. 45k"
                          className="w-32 bg-black/80 border border-surface-variant rounded-lg px-3 py-1.5 text-xs text-on-surface font-mono focus:border-gold-accent focus:outline-none min-h-[40px]"
                        />
                      )}

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveField(item)}
                        className="px-4 py-1.5 rounded-lg bg-gold-accent text-background font-mono text-xs uppercase font-bold hover:bg-gold-bright active:scale-95 disabled:opacity-50 transition-all min-h-[40px]"
                      >
                        {isSaving ? "Saving..." : "Save ✓"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {query.trim() && searchResults.length === 0 && (
            <div className="p-4 rounded-xl bg-surface-alt/40 border border-white/[0.04] text-center text-xs text-text-muted font-mono">
              No matching properties or fields found. Try &quot;parking&quot;, &quot;rent&quot;, or switch to &quot;Paste Chat&quot;.
            </div>
          )}
        </div>
      )}

      {/* ══ TIER 2: AUTOMATIC (CHAT & COPY-PASTE COPILOT) ══ */}
      {activeTab === "paste" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            Paste notes from a Viber/WhatsApp chat or type natural sentences (e.g. <em>&quot;Unit 1201 is now vacant, rent 48k. Parking is 5000.&quot;</em>).
          </p>

          <textarea
            rows={4}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your notes, chat message, or roster here..."
            className="w-full bg-black/60 border border-white/[0.12] focus:border-gold-accent rounded-xl p-3.5 text-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-gold-accent transition-all font-mono"
          />

          <div className="flex justify-between items-center">
            <span className="text-[12px] text-text-muted font-mono">
              Zero manual form filling required
            </span>
            <button
              type="button"
              disabled={isParsingIntent || !pastedText.trim()}
              onClick={handleParseIntent}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gold-accent text-background font-mono text-xs uppercase font-bold hover:bg-gold-bright active:scale-95 disabled:opacity-40 transition-all min-h-[44px]"
            >
              <Sparkles size={14} />
              {isParsingIntent ? "Analyzing..." : "Review Changes →"}
            </button>
          </div>

          {/* Diff & Approval Card */}
          {proposedUpdates.length > 0 && (
            <div className="mt-3 p-4 rounded-xl bg-surface-alt/80 border border-gold-accent/40 flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-gold-accent font-bold">
                  Proposed Updates ({proposedUpdates.length}):
                </span>
                <span className="text-[12px] text-text-muted font-mono">
                  Review before applying
                </span>
              </div>

              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {proposedUpdates.map((u, i) => (
                  <div key={u.id || i} className="p-2.5 rounded-lg bg-black/50 border border-white/[0.04] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary truncate max-w-[140px] sm:max-w-xs">
                        {u.propertyTitle} {u.unitIdentifier ? `· Unit ${u.unitIdentifier}` : ""}
                      </span>
                      <span className="text-text-muted">›</span>
                      <span className="text-on-surface font-bold">{u.fieldLabel}:</span>
                    </div>
                    <span className="text-gold-bright font-bold">
                      → {u.displayValue}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setProposedUpdates([])}
                  className="px-4 py-2 rounded-lg border border-white/[0.1] text-text-secondary hover:text-on-surface text-xs font-mono uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isApplyingUpdates}
                  onClick={handleApproveBatch}
                  className="px-5 py-2 rounded-lg bg-gold-accent text-background font-mono text-xs uppercase font-bold hover:bg-gold-bright active:scale-95 transition-all min-h-[40px]"
                >
                  {isApplyingUpdates ? "Applying..." : "Approve All Updates ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TIER 3: QUEUE-ASSISTED (SINGLE-USE PDF INGESTION) ══ */}
      {activeTab === "queue" && (
        <div className="flex flex-col gap-3">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/[0.15] hover:border-gold-accent/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer bg-black/40 hover:bg-black/60 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-gold-accent/10 border border-gold-accent/20 flex items-center justify-center text-gold-accent">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-sm font-working-title text-on-surface font-bold">
                {isUploadingQueue ? "Submitting to Queue..." : "Click or Drag to Upload PDF Brochure"}
              </p>
              <p className="text-xs text-text-muted mt-1 font-mono">
                Single-use policy: raw document will be deleted immediately after parsing.
              </p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              onChange={(e) => handleQueueUpload(e.target.files?.[0])}
            />
          </div>

          {/* Queue Status Confirmation Card */}
          {queueInfo && (
            <div className="p-4 rounded-xl bg-gold-accent/10 border border-gold-accent/40 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold-accent/20 border border-gold-accent/40 flex items-center justify-center text-gold-accent font-mono font-bold text-sm">
                  #{queueInfo.queueNumber}
                </div>
                <div>
                  <p className="text-sm font-working-title text-on-surface font-bold">
                    Property Dossier In Queue
                  </p>
                  <p className="text-xs text-text-secondary font-mono">
                    Position #{queueInfo.queueNumber} · Processing in background. You will be notified.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-black/60 text-gold-accent border border-gold-accent/30 text-[12px] font-mono uppercase font-bold">
                In Progress
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
