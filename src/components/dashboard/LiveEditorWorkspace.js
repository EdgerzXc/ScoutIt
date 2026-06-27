"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import CommercialFlow from "../property/CommercialFlow";
import ResidentialFlow from "../property/ResidentialFlow";
import { sanitizeObject } from "../../lib/sanitize";

const CATEGORIES = [
  { id: "residential", icon: "🏠", label: "Residential" },
  { id: "commercial", icon: "🏢", label: "Commercial" },
  { id: "str", icon: "🌙", label: "Short-Term Rental" },
  { id: "hospitality", icon: "🏨", label: "Hospitality" },
  { id: "restaurants", icon: "🍽️", label: "Restaurant" },
  { id: "venues", icon: "🎤", label: "Venue" },
];

const CATEGORY_FIELDS = {
  residential: [
    { key: "price", label: "Price (₱)", type: "number" },
    { key: "beds", label: "Bedrooms", type: "number" },
    { key: "baths", label: "Bathrooms", type: "number" },
    { key: "floor_sqm", label: "Floor area (sqm)", type: "number" },
    { key: "lot_sqm", label: "Lot area (sqm)", type: "number" },
    { key: "parking", label: "Parking slots", type: "number" },
    { key: "furnishing", label: "Furnishing", type: "select", options: ["Bare", "Semi-Furnished", "Fully Furnished"] },
    { key: "floorLevel", label: "Floor Level", type: "text" },
    { key: "view", label: "View", type: "text" },
    { key: "turnoverDate", label: "Turnover Date", type: "text" },
    { key: "petPolicy", label: "Pet Policy", type: "text" },
    { key: "assocDues", label: "Assoc Dues (₱/mo)", type: "number" },
    { key: "studio", label: "Studio Unit", type: "checkbox" },
    { key: "pricePerSqm", label: "Price / sqm", type: "number", proOnly: true },
    { key: "paymentTerms", label: "Payment Terms", type: "text", proOnly: true },
  ],
  commercial: [
    { key: "rentPerSqm", label: "Published rent (₱/sqm/mo)", type: "text" },
    { key: "totalGLA", label: "Total GLA (sqm)", type: "number" },
    { key: "floorPlate", label: "Floor Plate", type: "text" },
    { key: "buildingGrade", label: "Building grade", type: "select", options: ["Premium", "Grade A", "Grade B", "Grade C"] },
    { key: "handOver", label: "Hand-over condition", type: "select", options: ["Bare Shell", "Semi-Fitted", "Fitted", "As-is-where-is"] },
    { key: "availability", label: "Availability", type: "text" },
    { key: "minLeaseTerm", label: "Min. Lease Term", type: "text" },
    { key: "certification", label: "Certification", type: "text" },
    { key: "peza", label: "PEZA Accredited", type: "checkbox" },
    { key: "camc", label: "CAMC (₱/sqm/mo)", type: "text", proOnly: true },
    { key: "acCharges", label: "A/C charges", type: "text", proOnly: true },
    { key: "acSystem", label: "AC System", type: "text", proOnly: true },
    { key: "reservedParking", label: "Reserved Parking", type: "text", proOnly: true },
    { key: "escalation", label: "Escalation Rate", type: "text", proOnly: true },
    { key: "fitOut", label: "Fit-out Allowance", type: "text", proOnly: true },
    { key: "rentFree", label: "Rent-free Period", type: "text", proOnly: true },
    { key: "parkingRatio", label: "Parking Ratio", type: "text", proOnly: true },
    { key: "backupPower", label: "Backup Power", type: "text", proOnly: true },
    { key: "floorLoading", label: "Floor Loading", type: "text", proOnly: true },
    { key: "internet", label: "Internet Providers", type: "text", proOnly: true },
    { key: "availableUnits", label: "Available Units", type: "text", proOnly: true },
    { key: "towersZones", label: "Towers / Zones", type: "text", proOnly: true },
    { key: "capRate", label: "Cap Rate (%)", type: "number", proOnly: true },
    { key: "noi", label: "NOI", type: "number", proOnly: true },
  ],
  str: [
    { key: "nightlyRate", label: "Nightly rate (₱)", type: "number" },
    { key: "maxGuests", label: "Max guests", type: "number" },
    { key: "rating", label: "Avg. Rating", type: "number" },
    { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "bathrooms", label: "Bathrooms", type: "number" },
    { key: "minStay", label: "Minimum stay (nights)", type: "number" },
    { key: "checkInOut", label: "Check-in / out", type: "text" },
    { key: "weekendRate", label: "Weekend Rate (₱)", type: "number", proOnly: true },
    { key: "bedConfig", label: "Bed configuration", type: "text", proOnly: true },
    { key: "selfCheckIn", label: "Self check-in available", type: "checkbox", proOnly: true },
    { key: "houseRules", label: "House Rules", type: "text", proOnly: true },
    { key: "cancellation", label: "Cancellation Policy", type: "text", proOnly: true },
    { key: "permit", label: "DOT / LGU permit", type: "text", proOnly: true },
    { key: "wifiSpeed", label: "WiFi Speed", type: "text", proOnly: true },
  ],
  hospitality: [
    { key: "rooms", label: "Room Count", type: "number" },
    { key: "stars", label: "Star Rating", type: "number" },
    { key: "fbOutlets", label: "F&B Outlets", type: "number" },
    { key: "functionRooms", label: "Function Rooms", type: "number" },
    { key: "operator", label: "Operator / Brand", type: "text" },
    { key: "roomTypes", label: "Room Types", type: "text" },
    { key: "yearRenovated", label: "Built / Renovated", type: "text" },
    { key: "adr", label: "ADR (₱)", type: "number", proOnly: true },
    { key: "occupancy", label: "Occupancy Rate (%)", type: "number", proOnly: true },
    { key: "revpar", label: "RevPAR (₱)", type: "number", proOnly: true },
    { key: "capRate", label: "Cap Rate (%)", type: "number", proOnly: true },
    { key: "gfa", label: "GFA (sqm)", type: "number", proOnly: true },
    { key: "landArea", label: "Land Area (sqm)", type: "number", proOnly: true },
  ],
  restaurants: [
    { key: "floorArea", label: "Floor Area (sqm)", type: "number" },
    { key: "seating", label: "Seating capacity", type: "number" },
    { key: "kitchen", label: "Kitchen condition", type: "select", options: ["With Kitchen", "Bare", "Needs Build-out"] },
    { key: "footTraffic", label: "Foot traffic", type: "select", options: ["Low", "Medium", "High"] },
    { key: "frontage", label: "Storefront frontage", type: "text" },
    { key: "indoorOutdoor", label: "Indoor / Outdoor", type: "text" },
    { key: "previousUse", label: "Previous Use", type: "text" },
    { key: "hoodExhaust", label: "Hood / exhaust present", type: "checkbox", proOnly: true },
    { key: "greaseTrap", label: "Grease trap present", type: "checkbox", proOnly: true },
    { key: "gasLine", label: "Gas line available", type: "checkbox", proOnly: true },
    { key: "power", label: "Power Capacity", type: "text", proOnly: true },
    { key: "delivery", label: "Delivery Access", type: "checkbox", proOnly: true },
    { key: "liquor", label: "Liquor license eligible", type: "checkbox", proOnly: true },
    { key: "zoning", label: "F&B Zoning Permit", type: "text", proOnly: true },
    { key: "ceiling", label: "Ceiling Height", type: "text", proOnly: true },
    { key: "turnover", label: "Turnover Condition", type: "text", proOnly: true },
    { key: "parking", label: "Parking", type: "text", proOnly: true },
  ],
  venues: [
    { key: "seated", label: "Seated capacity", type: "number" },
    { key: "standing", label: "Standing capacity", type: "number" },
    { key: "floorArea", label: "Floor Area (sqm)", type: "number" },
    { key: "minHours", label: "Min Booking (hrs)", type: "number" },
    { key: "indoorOutdoor", label: "Indoor / Outdoor", type: "text" },
    { key: "aircon", label: "Air-conditioned", type: "checkbox" },
    { key: "catering", label: "Catering policy", type: "select", options: ["In-house only", "External allowed", "Both"] },
    { key: "layouts", label: "Layout configurations", type: "text", proOnly: true },
    { key: "ceiling", label: "Ceiling Height", type: "text", proOnly: true },
    { key: "av", label: "AV equipment included", type: "text", proOnly: true },
    { key: "power", label: "Power Capacity", type: "text", proOnly: true },
    { key: "parking", label: "Parking", type: "text", proOnly: true },
    { key: "accessibility", label: "Accessibility", type: "text", proOnly: true },
    { key: "noiseCurfew", label: "Noise curfew", type: "text", proOnly: true },
  ],
};

const CATEGORY_TO_LAYOUT_MAP = {
  "residential": ResidentialFlow,
  "commercial": CommercialFlow,
  "str": CommercialFlow,           
  "hospitality": CommercialFlow,
  "restaurants": CommercialFlow,
  "venues": CommercialFlow,
  "default": ResidentialFlow
};

export default function LiveEditorWorkspace({ onPublish, onClose, isEditing, initialData }) {
  const { raiseQuest } = require("../../context/DashboardContext").useDashboard();

  // State initialization
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category: initialData?.category || initialData?.spaceCategory || "",
    location: initialData?.location || "",
    price: initialData?.price || "", // Internal price
    mediaLink: initialData?.mediaLink || "",
    image: initialData?.image || (initialData?.photos && initialData?.photos[0]) || "", // Image for must-haves
    description: initialData?.description || initialData?.desc || "",
    verified: initialData?.verified || false,
    details: initialData?.details || {},
  });

  const [lastSaved, setLastSaved] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState("basics");
  const [mobileView, setMobileView] = useState("editor"); // "editor" | "preview"
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [activeQuests, setActiveQuests] = useState(initialData?.quests || {});
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvBlueprint, setCsvBlueprint] = useState(null);
  const [leftPaneWidth, setLeftPaneWidth] = useState(450);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [expandedUnitIdx, setExpandedUnitIdx] = useState(null);
  const isResizing = useRef(false);

  // Lock body scroll when IDE is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Load Draft on Mount
  useEffect(() => {
    if (!isEditing) {
      const savedDraft = localStorage.getItem("scoutit_listing_draft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          setLastSaved(new Date());
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
    setDraftLoaded(true);
  }, [isEditing]);

  // Auto-Save Draft
  useEffect(() => {
    if (draftLoaded && !isEditing) {
      // Only save if it has at least a title or location to avoid saving completely empty drafts
      if (formData.title.trim() || formData.location.trim()) {
        localStorage.setItem("scoutit_listing_draft", JSON.stringify(formData));
        setLastSaved(new Date());
      } else {
        localStorage.removeItem("scoutit_listing_draft");
      }
    }
  }, [formData, draftLoaded, isEditing]);

  const clearDraft = () => {
    if (window.confirm("Are you sure you want to clear your draft and start over?")) {
      localStorage.removeItem("scoutit_listing_draft");
      setFormData({
        title: "",
        category: "",
        location: "",
        price: "",
        mediaLink: "",
        image: "",
        description: "",
        verified: false,
        details: {},
      });
      setLastSaved(null);
    }
  };

  // Resize Logic
  const startResizing = useCallback((e) => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
  }, []);

  const resize = useCallback((e) => {
    if (isResizing.current) {
      let newWidth = e.clientX;
      if (newWidth < 300) newWidth = 300;
      if (newWidth > 1000) newWidth = 1000;
      setLeftPaneWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Validate the 5 must-haves
  const mustHaves = {
    title: !!formData.title.trim(),
    category: !!formData.category,
    location: !!formData.location.trim(),
    price: !!String(formData.price).trim(),
    media: !!formData.mediaLink.trim() || !!formData.image.trim()
  };
  const isPublishable = Object.values(mustHaves).every(Boolean);
  // A draft only needs a title — the whole point is to save unfinished work
  // without losing it. Publishing still requires all must-haves above.
  const canSaveDraft = mustHaves.title;

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setDetail = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      details: { ...prev.details, [key]: value },
    }));
  };

  // Convert formData into a format that CommercialFlow/ResidentialFlow understands
  const draftData = useMemo(() => {
    return {
      id: initialData?.id || "draft-id",
      title: formData.title || "Untitled Property",
      slug: initialData?.slug || "draft-property",
      spaceCategory: formData.category || "Residential",
      property_type: formData.category || "Residential",
      location: formData.location || "Location not set",
      city: formData.location ? formData.location.split(",")[0] : "City",
      desc: formData.description || "No description provided.",
      price: formData.price,
      mediaLink: formData.mediaLink,
      image: formData.image,
      photos: formData.mediaLink ? [formData.mediaLink] : (formData.image ? [formData.image] : []),
      ...formData.details, // Spread category-specific specs into the root for the flow components
      cat: {
        commercial: formData.details,
        residential: formData.details,
        str: formData.details,
        restaurant: formData.details,
        hospitality: formData.details,
        venue: formData.details,
      }
    };
  }, [formData, initialData]);

  const categoryFields = CATEGORY_FIELDS[formData.category] || [];

  const handlePublish = () => {
    if (isPublishable) {
      let score = 0;
      if (formData.category && formData.location) score += 20;
      if (categoryFields.length) {
        const filled = categoryFields.filter(f => {
          const v = formData.details?.[f.key];
          return v !== undefined && v !== "" && v !== false;
        }).length;
        score += Math.round((filled / categoryFields.length) * 25);
      }
      if (formData.mediaLink.trim() || formData.image.trim()) score += 20;
      if (formData.description.length > 20) score += 15;
      if (formData.verified) score += 20;
      const payload = { ...formData, completenessScore: score };
      if (!isEditing) localStorage.removeItem("scoutit_listing_draft");
      onPublish(sanitizeObject(payload), true);
    }
  };

  const handleSaveDraft = () => {
    if (canSaveDraft) {
      let score = 0;
      if (formData.category && formData.location) score += 20;
      if (categoryFields.length) {
        const filled = categoryFields.filter(f => {
          const v = formData.details?.[f.key];
          return v !== undefined && v !== "" && v !== false;
        }).length;
        score += Math.round((filled / categoryFields.length) * 25);
      }
      if (formData.mediaLink.trim() || formData.image.trim()) score += 20;
      if (formData.description.length > 20) score += 15;
      if (formData.verified) score += 20;
      const payload = { ...formData, completenessScore: score };
      if (!isEditing) localStorage.removeItem("scoutit_listing_draft");
      onPublish(sanitizeObject(payload), false);
    }
  };

  // Determine Layout Component
  let layoutKey = "default";
  for (const key of Object.keys(CATEGORY_TO_LAYOUT_MAP)) {
    if ((formData.category || "").toLowerCase().includes(key)) {
      layoutKey = key;
      break;
    }
  }
  const FlowLayout = CATEGORY_TO_LAYOUT_MAP[layoutKey];

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col md:flex-row overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      
      {/* ── LEFT PANEL: EDITOR ── */}
      <div 
        style={{ width: leftPaneWidth }} 
        className={`shrink-0 border-r border-surface-variant bg-surface flex flex-col z-10 relative h-full transition-none ${showMobilePreview ? 'hidden md:flex' : 'w-full md:flex'}`}
      >
        {/* Resize Handle */}
        <div 
          className="hidden md:flex absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-gold-accent/50 z-20 items-center justify-center transition-colors group"
          onMouseDown={startResizing}
        >
          <div className="w-[1px] h-12 bg-surface-variant group-hover:bg-gold-accent rounded"></div>
        </div>
        
        {/* Editor Header */}
        <div className="p-4 border-b border-surface-variant bg-background flex justify-between items-center sticky top-0 z-20">
          <button 
            className="text-text-secondary hover:text-on-surface font-working-title text-sm" 
            onClick={onClose}
          >
            ← {isEditing ? "Cancel" : "Exit"}
          </button>
          
          <div className="flex items-center gap-4">
            {!isEditing && lastSaved && (
              <button onClick={clearDraft} className="text-error/80 hover:text-error text-[10px] uppercase font-label-caps tracking-wider transition-colors">
                Clear Draft
              </button>
            )}
            <span className="hidden md:block font-label-caps text-[10px] tracking-widest text-gold-accent uppercase">
              {isEditing ? "Edit Dossier" : "New Property Draft"}
            </span>
          </div>
        </div>

        {/* Editor Sections */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          
          <section className="flex flex-col gap-4">
            <h3 className="font-headline-editorial text-2xl text-on-surface border-b border-surface-variant pb-2">Must Haves</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Property Title <span className="text-error">*</span></label>
              <input 
                className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                type="text" 
                value={formData.title} 
                onChange={e => setField("title", e.target.value)} 
                placeholder="e.g. Modern Villa in BGC" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Asset Category <span className="text-error">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    className={`flex items-center gap-2 px-3 py-4 rounded border text-left text-sm transition-colors ${formData.category === c.id ? 'bg-surface-container-low border-gold-accent text-gold-accent shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'bg-surface-alt border-surface-variant text-on-surface hover:border-text-secondary'}`}
                    onClick={() => setField("category", c.id)}
                  >
                    <span className="text-xl">{c.icon}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Location / Address <span className="text-error">*</span></label>
              <input 
                className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                type="text" 
                value={formData.location} 
                onChange={e => setField("location", e.target.value)} 
                placeholder="e.g. BGC Core" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Internal Price (₱) <span className="text-error">*</span></label>
              <input 
                className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                type="number" 
                value={formData.price} 
                onChange={e => setField("price", e.target.value)} 
                placeholder="e.g. 50000" 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Photo URL / Media Link <span className="text-error">*</span></label>
              <input 
                className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                type="text" 
                value={formData.mediaLink || formData.image} 
                onChange={e => {
                  setField("mediaLink", e.target.value);
                  setField("image", e.target.value); 
                }} 
                placeholder="https://..." 
              />
            </div>
          </section>

          {/* Section: Category Specs */}
          {categoryFields.length > 0 && (
            <section className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease]">
              <h3 className="font-headline-editorial text-2xl text-on-surface border-b border-surface-variant pb-2">Space Details</h3>
              {categoryFields.map(f => (
                f.type === 'checkbox' ? (
                  <label key={f.key} className="flex items-center gap-3 cursor-pointer text-on-surface bg-surface-alt border border-surface-variant rounded px-3 py-2.5 w-full">
                    <input type="checkbox" className="w-4 h-4 accent-gold-accent" checked={!!formData.details[f.key]} onChange={e => setDetail(f.key, e.target.checked)} disabled={activeQuests['full_dossier']} />
                    <span className="text-sm font-working-title">{f.label}</span>
                  </label>
                ) : (
                  <div key={f.key} className="flex flex-col gap-2">
                    <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">{f.label}</label>
                    {f.type === 'select' ? (
                      <select className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm" value={formData.details[f.key] || ''} onChange={e => setDetail(f.key, e.target.value)} disabled={activeQuests['full_dossier']}>
                        <option value="">Select…</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm" type={f.type === 'number' ? 'number' : 'text'} value={formData.details[f.key] || ''} onChange={e => setDetail(f.key, e.target.value)} disabled={activeQuests['full_dossier']} />
                    )}
                  </div>
                )
              ))}
            </section>
          )}

          {/* Section: Inventory */}
          <section className="flex flex-col gap-4">
            <h3 className="font-headline-editorial text-2xl text-on-surface border-b border-surface-variant pb-2 flex justify-between items-end">
              <span>Available Inventory</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsUploadingCsv(!isUploadingCsv)}
                  className="text-[10px] font-label-caps tracking-widest text-gold-accent uppercase hover:bg-gold-accent/10 px-2 py-1 rounded border border-gold-accent/30"
                >
                  {isUploadingCsv ? "Close CSV" : "Upload Unit Inventory (CSV)"}
                </button>
                <button 
                  onClick={() => setIsBulkEdit(!isBulkEdit)}
                  className="text-[10px] font-label-caps tracking-widest text-gold-accent uppercase hover:bg-gold-accent/10 px-2 py-1 rounded border border-gold-accent/30"
                >
                  {isBulkEdit ? "Form View" : "Grid View"}
                </button>
              </div>
            </h3>
            
            {isUploadingCsv && (
              <div className="border-2 border-dashed border-gold-accent/30 bg-surface-alt rounded p-8 flex flex-col items-center justify-center text-center gap-4 animate-[fadeIn_0.3s_ease]">
                <div className="text-gold-accent mb-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div>
                  <p className="text-sm font-working-title text-on-surface mb-1">Upload CSV or Excel</p>
                  <p className="text-xs text-text-secondary">Drag and drop your developer inventory file here.</p>
                </div>
                
                {csvBlueprint ? (
                  <div className="bg-surface-container-low p-4 rounded border border-surface-variant w-full mt-4 text-left">
                    <p className="text-xs font-label-caps text-gold-accent mb-2">✦ AI Mapping Complete</p>
                    <p className="text-xs text-on-surface">Blueprint generated from first 3 rows. Ready to process 500 rows.</p>
                  </div>
                ) : (
                  <button 
                    onClick={() => setCsvBlueprint(true)} // Mocking the upload process for now
                    className="mt-2 bg-surface-container-low border border-surface-variant hover:border-gold-accent text-xs font-label-caps tracking-widest text-on-surface px-4 py-2 rounded transition-colors"
                  >
                    Select File
                  </button>
                )}
              </div>
            )}
            
            {isBulkEdit ? (
              <div className="overflow-x-auto border border-surface-variant rounded bg-surface-alt">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-surface-variant bg-surface">
                      <th className="p-2 text-[9px] font-label-caps text-text-secondary uppercase font-normal">Unit Name</th>
                      <th className="p-2 text-[9px] font-label-caps text-text-secondary uppercase font-normal">Size (sqm)</th>
                      <th className="p-2 text-[9px] font-label-caps text-text-secondary uppercase font-normal">{formData.category === 'Residential Building' || formData.category === 'Condominium' ? 'Price' : 'Rate/sqm'}</th>
                      <th className="p-2 text-[9px] font-label-caps text-text-secondary uppercase font-normal">{formData.category === 'Residential Building' || formData.category === 'Condominium' ? 'Bedrooms' : 'Condition'}</th>
                      <th className="p-2 text-[9px] font-label-caps text-text-secondary uppercase font-normal">{formData.category === 'Residential Building' || formData.category === 'Condominium' ? 'Furnishing' : 'Layout'}</th>
                      <th className="p-2 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.details.units_inventory || []).map((unit, idx) => (
                      <tr key={idx} className="border-b border-surface-variant/50">
                        <td className="p-1"><input className="w-full bg-transparent p-1 text-xs text-on-surface focus:outline-none border border-transparent hover:border-surface-variant focus:border-gold-accent rounded" value={unit.name || ''} onChange={e => {
                          const list = [...(formData.details.units_inventory || [])];
                          list[idx] = { ...list[idx], name: e.target.value };
                          setDetail('units_inventory', list);
                        }} placeholder="Unit 101" /></td>
                        <td className="p-1"><input className="w-full bg-transparent p-1 text-xs text-on-surface focus:outline-none border border-transparent hover:border-surface-variant focus:border-gold-accent rounded" value={unit.size || ''} onChange={e => {
                          const list = [...(formData.details.units_inventory || [])];
                          list[idx] = { ...list[idx], size: e.target.value };
                          setDetail('units_inventory', list);
                        }} placeholder="150" /></td>
                        <td className="p-1"><input className="w-full bg-transparent p-1 text-xs text-on-surface focus:outline-none border border-transparent hover:border-surface-variant focus:border-gold-accent rounded" value={unit.price || ''} onChange={e => {
                          const list = [...(formData.details.units_inventory || [])];
                          list[idx] = { ...list[idx], price: e.target.value };
                          setDetail('units_inventory', list);
                        }} placeholder="50000" /></td>
                        <td className="p-1">
                          {formData.category === 'Residential Building' || formData.category === 'Condominium' ? (
                            <select className="w-full bg-transparent p-1 text-xs text-on-surface focus:outline-none border border-transparent hover:border-surface-variant focus:border-gold-accent rounded appearance-none" value={unit.condition || ''} onChange={e => {
                              const list = [...(formData.details.units_inventory || [])];
                              list[idx] = { ...list[idx], condition: e.target.value };
                              setDetail('units_inventory', list);
                            }}>
                              <option value="" className="bg-surface text-text-secondary">Type...</option>
                              <option value="Studio" className="bg-surface text-on-surface">Studio</option>
                              <option value="1BR" className="bg-surface text-on-surface">1BR</option>
                              <option value="2BR" className="bg-surface text-on-surface">2BR</option>
                              <option value="3BR" className="bg-surface text-on-surface">3BR</option>
                              <option value="4BR+" className="bg-surface text-on-surface">4BR+</option>
                              <option value="Penthouse" className="bg-surface text-on-surface">Penthouse</option>
                            </select>
                          ) : (
                            <select className="w-full bg-transparent p-1 text-xs text-on-surface focus:outline-none border border-transparent hover:border-surface-variant focus:border-gold-accent rounded appearance-none" value={unit.condition || ''} onChange={e => {
                              const list = [...(formData.details.units_inventory || [])];
                              list[idx] = { ...list[idx], condition: e.target.value };
                              setDetail('units_inventory', list);
                            }}>
                              <option value="" className="bg-surface text-text-secondary">Condition...</option>
                              <option value="Bare Shell" className="bg-surface text-on-surface">Bare Shell</option>
                              <option value="Warm Shell" className="bg-surface text-on-surface">Warm Shell</option>
                              <option value="Fully Fitted" className="bg-surface text-on-surface">Fully Fitted</option>
                              <option value="As-is Where-is" className="bg-surface text-on-surface">As-is Where-is</option>
                            </select>
                          )}
                        </td>
                        <td className="p-1">
                          {formData.category === 'Residential Building' || formData.category === 'Condominium' ? (
                            <select className="w-full bg-transparent p-1 text-xs text-on-surface focus:outline-none border border-transparent hover:border-surface-variant focus:border-gold-accent rounded appearance-none" value={unit.layout || ''} onChange={e => {
                              const list = [...(formData.details.units_inventory || [])];
                              list[idx] = { ...list[idx], layout: e.target.value };
                              setDetail('units_inventory', list);
                            }}>
                              <option value="" className="bg-surface text-text-secondary">Furnishing...</option>
                              <option value="Unfurnished" className="bg-surface text-on-surface">Unfurnished</option>
                              <option value="Semi-Furnished" className="bg-surface text-on-surface">Semi-Furnished</option>
                              <option value="Fully Furnished" className="bg-surface text-on-surface">Fully Furnished</option>
                            </select>
                          ) : (
                            <select className="w-full bg-transparent p-1 text-xs text-on-surface focus:outline-none border border-transparent hover:border-surface-variant focus:border-gold-accent rounded appearance-none" value={unit.layout || ''} onChange={e => {
                              const list = [...(formData.details.units_inventory || [])];
                              list[idx] = { ...list[idx], layout: e.target.value };
                              setDetail('units_inventory', list);
                            }}>
                              <option value="" className="bg-surface text-text-secondary">Layout...</option>
                              <option value="Open Plan" className="bg-surface text-on-surface">Open Plan</option>
                              <option value="Partitioned" className="bg-surface text-on-surface">Partitioned</option>
                              <option value="Co-working" className="bg-surface text-on-surface">Co-working</option>
                            </select>
                          )}
                        </td>
                        <td className="p-1 text-center text-[10px] flex items-center justify-center gap-1.5 h-full pt-2">
                          <button onClick={() => setExpandedUnitIdx(idx)} className="text-text-secondary hover:text-on-surface transition-colors" title="Settings">⚙️</button>
                          <button onClick={() => {
                            const list = [...(formData.details.units_inventory || [])];
                            list.splice(idx + 1, 0, { ...list[idx] });
                            setDetail('units_inventory', list);
                          }} className="text-text-secondary hover:text-on-surface transition-colors" title="Duplicate Row">⧉</button>
                          <button onClick={() => {
                            const list = [...(formData.details.units_inventory || [])];
                            list.splice(idx, 1);
                            setDetail('units_inventory', list);
                          }} className="text-error hover:text-error/80 transition-colors" title="Delete Row">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="w-full p-2 text-xs text-gold-accent border-t border-surface-variant" onClick={() => setDetail('units_inventory', [...(formData.details.units_inventory || []), {name: '', size: '', price: '', condition: '', layout: ''}])}>+ Add Row</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(formData.details.units_inventory || []).map((unit, idx) => (
                  <div key={idx} className="bg-surface-alt border border-surface-variant rounded p-3 text-sm">
                    {unit.name || "Unnamed Unit"}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Deep Intelligence (Optional) */}
          <section className="flex flex-col gap-4">
            <h3 className="font-headline-editorial text-2xl text-on-surface border-b border-surface-variant pb-2">Deep Intelligence <span className="text-sm text-text-secondary font-working-title font-normal tracking-normal ml-2">(Optional)</span></h3>
            
            <div className="bg-surface-alt border border-gold-accent/30 rounded p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gold-accent" />
              <div className="flex items-center gap-2 text-gold-accent font-bold text-sm tracking-wide">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                VERIFIED SCOUT PAYWALL
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                You <strong>do not</strong> need to fill this out. If left blank, our QuestIT Pros will gather this data for you later. Anything you enter here is secured behind our premium paywall and will only be visible to serious buyers with a Premium Subscription.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Ventilation Quality</label>
                <select className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm focus:border-gold-accent focus:outline-none" value={formData.details.ventilationQuality || ''} onChange={e => setDetail('ventilationQuality', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Excellent / Cross-ventilated">Excellent / Cross-ventilated</option>
                  <option value="Good / Standard">Good / Standard</option>
                  <option value="Poor / Needs AC">Poor / Needs AC</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Noise Level</label>
                <select className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm focus:border-gold-accent focus:outline-none" value={formData.details.noiseLevel || ''} onChange={e => setDetail('noiseLevel', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Low / Double-glazed">Low / Double-glazed</option>
                  <option value="Moderate / Typical City">Moderate / Typical City</option>
                  <option value="High / Street-facing">High / Street-facing</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Natural Light Score</label>
                <select className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm focus:border-gold-accent focus:outline-none" value={formData.details.naturalLight || ''} onChange={e => setDetail('naturalLight', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Excellent / Morning Sun">Excellent / Morning Sun</option>
                  <option value="Good / Afternoon Sun">Good / Afternoon Sun</option>
                  <option value="Low / Inner Unit">Low / Inner Unit</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Privacy Score</label>
                <select className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm focus:border-gold-accent focus:outline-none" value={formData.details.privacyScore || ''} onChange={e => setDetail('privacyScore', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="High / Exclusive Floor">High / Exclusive Floor</option>
                  <option value="Moderate / Shared Hallway">Moderate / Shared Hallway</option>
                  <option value="Low / High Foot Traffic">Low / High Foot Traffic</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Negotiation Buffer</label>
                <input className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm focus:border-gold-accent focus:outline-none" placeholder="e.g. Willing to accept 5% below asking if cash buyer" value={formData.details.negotiationBuffer || ''} onChange={e => setDetail('negotiationBuffer', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Section: Editorial */}
          <section className="flex flex-col gap-4 pb-32">
            <h3 className="font-headline-editorial text-2xl text-on-surface border-b border-surface-variant pb-2">Editorial</h3>
            <textarea className="bg-surface-alt border border-surface-variant rounded px-3 py-3 text-on-surface min-h-[120px] text-sm" value={formData.description} onChange={e => setField("description", e.target.value)} placeholder="Property description..." />
            
            <label className="flex items-center gap-3 cursor-pointer text-on-surface bg-surface-alt border border-surface-variant rounded px-3 py-3">
              <input type="checkbox" className="w-5 h-5 accent-gold-accent" checked={formData.verified} onChange={e => setField("verified", e.target.checked)} />
              <span className="text-sm font-bold text-gold-accent">Owner Verified</span>
            </label>
          </section>
        </div>

        <div className="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-surface-variant bg-background shrink-0">
          {!isPublishable && <p className="text-xs text-text-secondary mb-2 italic w-full text-center">{canSaveDraft ? "Fill in all required fields (*) to publish — or save a draft for now." : "Add a title to save a draft; fill all required fields (*) to publish."}</p>}
          {lastSaved && !isEditing && (
            <p className="text-[10px] text-gold-accent mb-2 text-center font-working-title">
              ✓ Draft auto-saved at {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          )}
          <div className="flex gap-2">
            <button
              className="flex-1 bg-surface-alt border border-surface-variant text-on-surface font-bold py-3.5 rounded hover:bg-surface-variant transition-colors disabled:opacity-50"
              disabled={!canSaveDraft}
              onClick={handleSaveDraft}
            >
              {isEditing ? "Save Changes" : "Save as Draft"}
            </button>
            <button
              className="flex-1 bg-gold-accent text-background font-bold py-3.5 rounded hover:opacity-90 disabled:opacity-50"
              disabled={!isPublishable}
              onClick={handlePublish}
            >
              {isEditing ? "Publish Updates to Feed" : "Publish to Live Feed"}
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: LIVE PREVIEW (The Canvas) ── */}
      <div className={`flex-1 bg-background relative overflow-y-auto ${mobileView === 'preview' ? 'block' : 'hidden md:block'}`}>
        {/* Draft Mode Banner — pointer-events-none so it doesn't block clicks on the Go Back button behind it */}
        <div className="absolute top-0 left-0 w-full z-50 bg-gold-accent text-background text-center py-1.5 font-label-caps text-[10px] tracking-[0.3em] font-bold shadow-md pointer-events-none">
          LIVE PREVIEW / DRAFT MODE
        </div>
        
        {/* Render the Master Page Component inline */}
        <div className="mt-10 opacity-90 md:scale-[0.98] origin-top transition-all">
          <FlowLayout slug={null} draftData={draftData} isDraftMode={true} />
        </div>
      </div>

      {/* ── MOBILE TOGGLE BUTTON (Only shows in Preview Mode) ── */}
      {mobileView === 'preview' && (
        <button 
          className="md:hidden fixed bottom-6 right-6 z-[70] bg-gold-accent text-background font-working-title px-4 py-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gold-accent/20 flex items-center gap-2 tracking-wide font-bold"
          onClick={() => setMobileView('editor')}
        >
          ✏️ Editor
        </button>
      )}

      {/* ── ROW SETTINGS MODAL ── */}
      {expandedUnitIdx !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-md px-4">
          <div className="w-full max-w-md bg-surface border border-surface-variant rounded-lg shadow-2xl p-6 animate-[slideUp_0.3s_ease-out]">
            <h3 className="font-headline-editorial text-2xl text-on-surface mb-2">Deep Data</h3>
            <p className="text-xs text-text-secondary mb-6 tracking-widest font-label-caps uppercase">Unit {formData.details.units_inventory[expandedUnitIdx]?.name || (expandedUnitIdx + 1)}</p>
            
            <div className="flex flex-col gap-4 mb-8">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Parking Allotment</span>
                <input className="bg-surface-alt border border-surface-variant rounded px-3 py-2 text-on-surface text-sm focus:border-gold-accent focus:outline-none" placeholder="e.g. 1 slot per 100 sqm" value={formData.details.units_inventory[expandedUnitIdx]?.parking || ''} onChange={e => {
                  const list = [...(formData.details.units_inventory || [])];
                  list[expandedUnitIdx] = { ...list[expandedUnitIdx], parking: e.target.value };
                  setDetail('units_inventory', list);
                }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Association Dues (CUSA)</span>
                <input className="bg-surface-alt border border-surface-variant rounded px-3 py-2 text-on-surface text-sm focus:border-gold-accent focus:outline-none" placeholder="e.g. Php 200/sqm" value={formData.details.units_inventory[expandedUnitIdx]?.dues || ''} onChange={e => {
                  const list = [...(formData.details.units_inventory || [])];
                  list[expandedUnitIdx] = { ...list[expandedUnitIdx], dues: e.target.value };
                  setDetail('units_inventory', list);
                }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Turnover Date</span>
                <input className="bg-surface-alt border border-surface-variant rounded px-3 py-2 text-on-surface text-sm focus:border-gold-accent focus:outline-none" placeholder="e.g. Q4 2026 or RFO" value={formData.details.units_inventory[expandedUnitIdx]?.turnover || ''} onChange={e => {
                  const list = [...(formData.details.units_inventory || [])];
                  list[expandedUnitIdx] = { ...list[expandedUnitIdx], turnover: e.target.value };
                  setDetail('units_inventory', list);
                }} />
              </label>
            </div>

            <button
              className="w-full bg-gold-accent text-background font-working-title font-bold px-4 py-3 rounded hover:opacity-90 transition-opacity"
              onClick={() => setExpandedUnitIdx(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Quest Modal */}
      {showQuestModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-md px-4">
          <div className="w-full max-w-sm bg-surface border border-surface-variant rounded-lg shadow-2xl p-6 animate-[slideUp_0.3s_ease-out]">
            <h3 className="font-headline-editorial text-2xl text-on-surface mb-2">Raise a Data Quest</h3>
            <p className="text-sm text-text-secondary mb-6">
              Need comprehensive data or specific details researched? Submit this listing to the QuestIT network for Pros to review and complete.
              <br /><br />
              <strong className="text-gold-accent">This is completely free to post.</strong> You only spend Connects if you specifically match with a Pro later.
            </p>
            <div className="flex gap-3 mt-4">
              <button 
                className="flex-1 px-4 py-3 border border-surface-variant text-text-secondary rounded hover:text-on-surface hover:bg-surface-container transition-colors" 
                onClick={() => setShowQuestModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-gold-accent text-background font-working-title font-bold px-4 py-3 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                onClick={async () => {
                  const success = await raiseQuest(initialData?.id || "draft", "full_dossier");
                  if (success) {
                    setActiveQuests(prev => ({ ...prev, 'full_dossier': true }));
                    setShowQuestModal(false);
                  }
                }}
              >
                <span>Confirm & Request Pro</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
