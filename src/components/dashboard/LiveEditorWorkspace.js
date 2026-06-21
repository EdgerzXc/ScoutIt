"use client";

import { useState, useMemo, useEffect } from "react";
import CommercialFlow from "@/components/property/CommercialFlow";
import ResidentialFlow from "@/components/property/ResidentialFlow";

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
    { key: "beds", label: "Bedrooms", type: "number" },
    { key: "baths", label: "Bathrooms", type: "number" },
    { key: "floor_sqm", label: "Floor area (sqm)", type: "number", proOnly: true },
    { key: "lot_sqm", label: "Lot area (sqm)", type: "number" },
    { key: "parking", label: "Parking slots", type: "number" },
    { key: "furnishing", label: "Furnishing", type: "select", options: ["Bare", "Semi-Furnished", "Fully Furnished"] },
    { key: "floor_level", label: "Unit floor level", type: "text" },
    { key: "view", label: "View", type: "text" },
  ],
  commercial: [
    { key: "rent_per_sqm", label: "Published rent (₱/sqm/mo)", type: "text", proOnly: true },
    { key: "camc", label: "CAMC (₱/sqm/mo)", type: "text", proOnly: true },
    { key: "ac_charges", label: "A/C charges", type: "text", proOnly: true },
    { key: "building_grade", label: "Building grade", type: "select", options: ["Premium", "Grade A", "Grade B"], proOnly: true },
    { key: "hand_over_condition", label: "Hand-over condition", type: "select", options: ["Bare Shell", "Semi-Fitted", "Fitted", "As-is-where-is"] },
    { key: "availability", label: "Availability", type: "text" },
    { key: "total_gla", label: "Total GLA (sqm)", type: "number", proOnly: true },
    { key: "peza", label: "PEZA certified", type: "checkbox", proOnly: true },
  ],
  str: [
    { key: "max_guests", label: "Max guests", type: "number" },
    { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "bed_config", label: "Bed configuration", type: "text" },
    { key: "baths", label: "Bathrooms", type: "number" },
    { key: "nightly_rate", label: "Nightly rate (₱)", type: "text" },
    { key: "min_stay_nights", label: "Minimum stay (nights)", type: "number" },
    { key: "self_check_in", label: "Self check-in available", type: "checkbox" },
    { key: "permit_accreditation", label: "DOT / LGU permit (verify)", type: "text", proOnly: true },
  ],
  hospitality: [
    { key: "room_count", label: "Rooms / keys", type: "number" },
    { key: "star_rating", label: "Star rating", type: "number" },
    { key: "room_types", label: "Room types", type: "text" },
    { key: "fb_outlets", label: "F&B outlets", type: "number" },
    { key: "function_rooms", label: "Function rooms", type: "number" },
    { key: "operator_brand", label: "Operator / brand", type: "text", proOnly: true },
  ],
  restaurants: [
    { key: "seating_capacity", label: "Seating capacity", type: "number" },
    { key: "kitchen_condition", label: "Kitchen condition", type: "select", options: ["With Kitchen", "Bare", "Needs Build-out"] },
    { key: "hood_exhaust", label: "Hood / exhaust present", type: "checkbox", proOnly: true },
    { key: "grease_trap", label: "Grease trap present", type: "checkbox", proOnly: true },
    { key: "gas_line", label: "Gas line available", type: "checkbox", proOnly: true },
    { key: "frontage", label: "Storefront frontage", type: "text" },
    { key: "foot_traffic", label: "Foot traffic", type: "select", options: ["Low", "Medium", "High"] },
    { key: "liquor_license", label: "Liquor license eligible", type: "checkbox", proOnly: true },
  ],
  venues: [
    { key: "capacity_seated", label: "Seated capacity", type: "number" },
    { key: "capacity_standing", label: "Standing capacity", type: "number" },
    { key: "layout_configs", label: "Layout configurations", type: "text" },
    { key: "av_equipment", label: "AV equipment included", type: "text", proOnly: true },
    { key: "catering_policy", label: "Catering policy", type: "select", options: ["In-house only", "External allowed", "Both"] },
    { key: "air_conditioning", label: "Air-conditioned", type: "checkbox" },
    { key: "rental_rate", label: "Rental rate (₱)", type: "text" },
    { key: "noise_curfew", label: "Noise curfew", type: "text", proOnly: true },
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

  const [activeSection, setActiveSection] = useState("basics");
  const [mobileView, setMobileView] = useState("editor"); // "editor" | "preview"
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [activeQuests, setActiveQuests] = useState(initialData?.quests || {});

  // Lock body scroll when IDE is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Validate the 5 must-haves
  const mustHaves = {
    title: !!formData.title.trim(),
    category: !!formData.category,
    location: !!formData.location.trim(),
    price: !!String(formData.price).trim(),
    media: !!formData.mediaLink.trim() || !!formData.image.trim()
  };
  const isPublishable = Object.values(mustHaves).every(Boolean);

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
    };
  }, [formData, initialData]);

  const categoryFields = CATEGORY_FIELDS[formData.category] || [];

  const handlePublish = () => {
    if (isPublishable) {
      // Completeness score roughly based on fields filled
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

      onPublish({ ...formData, completenessScore: score });
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
    <div className="fixed inset-0 z-50 bg-background flex flex-col md:flex-row overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* ── LEFT PANEL: EDITOR (The Remote Control) ── */}
      <div className={`w-full md:w-[400px] lg:w-[450px] bg-surface border-r border-surface-variant flex flex-col h-full z-10 shrink-0 ${mobileView === 'editor' ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Editor Header */}
        <div className="p-4 border-b border-surface-variant bg-background flex justify-between items-center sticky top-0 z-20">
          <button 
            className="text-text-secondary hover:text-on-surface font-working-title text-sm" 
            onClick={onClose}
          >
            ← {isEditing ? "Cancel" : "Exit"}
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden flex items-center gap-1.5 font-label-caps text-[10px] md:text-xs tracking-widest text-gold-accent uppercase border border-gold-accent/30 px-3 py-2 rounded hover:bg-gold-accent/10"
              onClick={() => setMobileView('preview')}
            >
              👁️ Preview
            </button>
            <span className="hidden md:block font-label-caps text-[10px] tracking-widest text-gold-accent uppercase">
              {isEditing ? "Edit Dossier" : "New Property Draft"}
            </span>
          </div>
        </div>

        {/* Editor Sections (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
          
          {/* Section: Basics */}
          <section className="flex flex-col gap-4">
            <h3 className="font-headline-editorial text-2xl text-on-surface border-b border-surface-variant pb-2">1. Must Haves</h3>
            
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
              <span className="text-[10px] text-text-muted">This is for internal ranking. It will only be shown publicly in 'Your Move' if you verify it.</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Photo URL / Media Link <span className="text-error">*</span></label>
              <div className="bg-gold-accent/10 border border-gold-accent/30 text-gold-accent p-3 rounded text-xs mb-1">
                ⚠️ Ensure folder permissions are set to "Anyone with the link can view" to allow brokers immediate access.
              </div>
              <input 
                className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                type="text" 
                value={formData.mediaLink || formData.image} 
                onChange={e => {
                  setField("mediaLink", e.target.value);
                  setField("image", e.target.value); // Fallback for single image
                }} 
                placeholder="https://..." 
              />
            </div>
          </section>

          {/* Section: Category Specs */}
          {categoryFields.length > 0 && (
            <section className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease]">
              <h3 className="font-headline-editorial text-2xl text-on-surface border-b border-surface-variant pb-2">2. Space Details</h3>
              <p className="text-xs text-text-secondary mb-2">Leave blank if unknown. Never guess.</p>
              
              {categoryFields.map(f => (
                f.type === 'checkbox' ? (
                  <label key={f.key} className="flex items-center gap-3 cursor-pointer text-on-surface bg-surface-alt border border-surface-variant rounded px-3 py-2.5 w-full relative group">
                    <input type="checkbox" className="w-4 h-4 accent-gold-accent" checked={!!formData.details[f.key]} onChange={e => setDetail(f.key, e.target.checked)} disabled={activeQuests['full_dossier']} />
                    <span className="text-sm font-working-title">{f.label}</span>
                  </label>
                ) : (
                  <div key={f.key} className="flex flex-col gap-2 relative group">
                    <div className="flex justify-between items-center h-5">
                      <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">{f.label}</label>
                    </div>
                    {f.type === 'select' ? (
                      <select className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors text-sm" value={formData.details[f.key] || ''} onChange={e => setDetail(f.key, e.target.value)} disabled={activeQuests['full_dossier']}>
                        <option value="">Select…</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors text-sm" type={f.type === 'number' ? 'number' : 'text'} value={formData.details[f.key] || ''} onChange={e => setDetail(f.key, e.target.value)} disabled={activeQuests['full_dossier']} />
                    )}
                  </div>
                )
              ))}
            </section>
          )}

          {/* Section: Story & Validation */}
          <section className="flex flex-col gap-4">
            <h3 className="font-headline-editorial text-2xl text-on-surface border-b border-surface-variant pb-2">3. Editorial</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase flex justify-between">
                Description
                <span className="text-text-muted">{formData.description.length} chars</span>
              </label>
              <textarea 
                className="bg-surface-alt border border-surface-variant rounded px-3 py-3 text-on-surface min-h-[120px] focus:outline-none focus:border-gold-accent transition-colors text-sm resize-none" 
                value={formData.description} 
                onChange={e => setField("description", e.target.value)} 
                placeholder="Outline the property's unique value proposition..."
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer text-on-surface bg-surface-alt border border-surface-variant rounded px-3 py-3 w-full mt-2">
              <input type="checkbox" className="w-5 h-5 accent-gold-accent" checked={formData.verified} onChange={e => setField("verified", e.target.checked)} />
              <div className="flex flex-col">
                <span className="text-sm font-working-title font-bold text-gold-accent">Owner Verified</span>
                <span className="text-xs text-text-secondary">I have title/docs ready for proof.</span>
              </div>
            </label>
            
            <div className="mt-6 p-4 rounded bg-surface-container-low border border-gold-accent/20">
              <h4 className="font-working-title font-bold text-sm text-gold-accent mb-2">Need a fully comprehensive dossier?</h4>
              <p className="text-xs text-text-secondary mb-4">
                If you don't know all the specifications, you can raise a Data Quest to the QuestIT network. A verified Pro will research and complete your listing data for you.
              </p>
              <button 
                className="w-full border border-gold-accent text-gold-accent hover:bg-gold-accent/10 font-working-title font-bold px-4 py-2.5 rounded transition-all text-sm flex items-center justify-center gap-2"
                onClick={() => setShowQuestModal(true)}
                disabled={activeQuests['full_dossier']}
              >
                {activeQuests['full_dossier'] ? "✨ Pro Completion Requested" : "✨ Request Pro Completion"}
              </button>
            </div>
          </section>

          <div className="pb-56"></div> {/* Extra padding to clear tall mobile footer (with missing fields list) */}
        </div>

        {/* Publish Gate Footer */}
        <div className="absolute bottom-0 left-0 w-full md:w-[400px] lg:w-[450px] bg-background border-t border-surface-variant p-4 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          {!isPublishable && (
            <div className="mb-3 text-xs text-error font-working-title">
              <span className="font-bold">Missing Must-Haves:</span>
              <ul className="list-disc pl-4 mt-1 opacity-80">
                {!mustHaves.title && <li>Title</li>}
                {!mustHaves.category && <li>Asset Category</li>}
                {!mustHaves.location && <li>Location</li>}
                {!mustHaves.price && <li>Internal Price</li>}
                {!mustHaves.media && <li>Photo / Media Link</li>}
              </ul>
            </div>
          )}
          <button 
            className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-3.5 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider" 
            disabled={!isPublishable} 
            onClick={handlePublish}
          >
            {isEditing ? "Update Property" : "Publish Draft"}
          </button>
        </div>

      </div>

      {/* ── RIGHT PANEL: LIVE PREVIEW (The Canvas) ── */}
      <div className={`flex-1 bg-background relative overflow-y-auto ${mobileView === 'preview' ? 'block' : 'hidden md:block'}`}>
        {/* Draft Mode Banner */}
        <div className="absolute top-0 left-0 w-full z-50 bg-gold-accent text-background text-center py-1.5 font-label-caps text-[10px] tracking-[0.3em] font-bold shadow-md">
          LIVE PREVIEW / DRAFT MODE
        </div>
        
        {/* Render the Master Page Component inline */}
        <div className="mt-8 md:pointer-events-none opacity-90 md:scale-[0.98] origin-top transition-all">
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
