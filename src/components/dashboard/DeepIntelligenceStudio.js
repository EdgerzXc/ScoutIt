"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import CommercialFlow from "../property/CommercialFlow";
import ResidentialFlow from "../property/ResidentialFlow";
import { sanitizeObject } from "../../lib/sanitize";
import { supabase } from "../../lib/supabaseClient";
import { DEEP_INTEL_SCHEMA } from "../../lib/deepIntelSchema";
import PhotoUploader from "./PhotoUploader";

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
    { key: "Beds", label: "Bedrooms", type: "number", proOnly: false },
    { key: "Baths", label: "Bathrooms", type: "number", proOnly: false },
    { key: "Floor_Area_Sqm", label: "Floor area (sqm)", type: "number", proOnly: false },
    { key: "Lot_Area_Sqm", label: "Lot area (sqm)", type: "number", proOnly: false },
    { key: "Parking_Slots", label: "Parking slots", type: "number", proOnly: false },
    { key: "Furnishing", label: "Furnishing", type: "select", options: ["Bare", "Semi-Furnished", "Fully Furnished"], proOnly: false },
    { key: "RS_Floor_Level", label: "Floor Level", type: "text", proOnly: false },
    { key: "RS_View", label: "View", type: "text", proOnly: false },
    { key: "RS_Turnover_Date", label: "Turnover Date", type: "text", proOnly: false },
    { key: "RS_Pet_Policy", label: "Pet Policy", type: "text", proOnly: false },
    { key: "RS_Assoc_Dues", label: "Assoc Dues (₱/mo)", type: "number", proOnly: false },
    { key: "RS_Studio_Flag", label: "Studio Unit", type: "checkbox", proOnly: false },
    { key: "Amenities", label: "Amenities", type: "text", proOnly: false },
    { key: "TitleStatus", label: "Title Status", type: "text", proOnly: false },
    { key: "RS_Price", label: "Residential Price", type: "number", proOnly: false },
    { key: "RS_Price_Per_Sqm", label: "Price / sqm", type: "number", proOnly: true },
    { key: "RS_Payment_Terms", label: "Payment Terms", type: "text", proOnly: true },
  ],
  commercial: [
    { key: "CM_Rent_Per_Sqm", label: "Published rent (₱/sqm/mo)", type: "number", proOnly: false },
    { key: "CM_Total_GLA", label: "Total GLA (sqm)", type: "number", proOnly: false },
    { key: "CM_Floor_Plate_Sqm", label: "Floor Plate (sqm)", type: "number", proOnly: false },
    { key: "CM_Building_Grade", label: "Building grade", type: "select", options: ["Premium", "Grade A", "Grade B", "Grade C"], proOnly: false },
    { key: "CM_Hand_Over_Condition", label: "Hand-over condition", type: "select", options: ["Bare Shell", "Warm Shell", "Fitted", "As-is-where-is"], proOnly: false },
    { key: "CM_Availability_Status", label: "Availability", type: "text", proOnly: false },
    { key: "CM_Min_Lease_Term", label: "Min. Lease Term", type: "text", proOnly: false },
    { key: "CM_Certification", label: "Certification", type: "text", proOnly: false },
    { key: "PEZA", label: "PEZA Accredited", type: "checkbox", proOnly: false },
    { key: "CM_CAMC_Per_Sqm", label: "CAMC (₱/sqm/mo)", type: "number", proOnly: false },
    { key: "CM_AC_Charges", label: "A/C charges", type: "number", proOnly: false },
    { key: "CM_AC_System", label: "AC System", type: "text", proOnly: true },
    { key: "CM_Reserved_Parking", label: "Reserved Parking", type: "text", proOnly: true },
    { key: "CM_Escalation_Rate", label: "Escalation Rate", type: "text", proOnly: true },
    { key: "CM_Fit_Out_Allowance", label: "Fit-out Allowance", type: "text", proOnly: true },
    { key: "CM_Rent_Free_Period", label: "Rent-free Period", type: "text", proOnly: true },
    { key: "CM_Parking_Ratio", label: "Parking Ratio", type: "text", proOnly: true },
    { key: "CM_Backup_Power", label: "Backup Power", type: "text", proOnly: true },
    { key: "CM_Floor_Loading", label: "Floor Loading", type: "text", proOnly: true },
    { key: "CM_Internet_Providers", label: "Internet Providers", type: "text", proOnly: true },
    { key: "CM_Available_Units_Summary", label: "Available Units", type: "text", proOnly: true },
    { key: "CM_Towers_Zones", label: "Towers / Zones", type: "text", proOnly: true },
    { key: "CM_Cap_Rate", label: "Cap Rate (%)", type: "number", proOnly: true },
    { key: "CM_NOI", label: "NOI", type: "number", proOnly: true },
  ],
  str: [
    { key: "STR_Nightly_Rate", label: "Nightly rate (₱)", type: "number", proOnly: false },
    { key: "STR_Cleaning_Fee", label: "Cleaning Fee (₱)", type: "number", proOnly: false },
    { key: "STR_Max_Guests", label: "Max guests", type: "number", proOnly: false },
    { key: "STR_Avg_Rating", label: "Avg. Rating", type: "number", proOnly: false },
    { key: "STR_Bedrooms", label: "Bedrooms", type: "number", proOnly: false },
    { key: "STR_Bathrooms", label: "Bathrooms", type: "number", proOnly: false },
    { key: "STR_Min_Stay_Nights", label: "Minimum stay (nights)", type: "number", proOnly: false },
    { key: "STR_Check_In_Out", label: "Check-in / out", type: "text", proOnly: false },
    { key: "Amenities", label: "Amenities", type: "text", proOnly: false },
    { key: "STR_Weekend_Rate", label: "Weekend Rate (₱)", type: "number", proOnly: true },
    { key: "STR_Bed_Config", label: "Bed configuration", type: "text", proOnly: true },
    { key: "STR_Self_Check_In", label: "Self check-in available", type: "checkbox", proOnly: true },
    { key: "STR_House_Rules", label: "House Rules", type: "text", proOnly: true },
    { key: "STR_Cancellation_Policy", label: "Cancellation Policy", type: "text", proOnly: true },
    { key: "STR_Permit_Accreditation", label: "DOT / LGU permit", type: "text", proOnly: true },
    { key: "STR_WiFi_Speed", label: "WiFi Speed", type: "text", proOnly: true },
  ],
  hospitality: [
    { key: "HOSP_Room_Count", label: "Room Count", type: "number", proOnly: false },
    { key: "HOSP_Star_Rating", label: "Star Rating", type: "number", proOnly: false },
    { key: "HOSP_FB_Outlets", label: "F&B Outlets", type: "number", proOnly: false },
    { key: "HOSP_Function_Rooms", label: "Function Rooms", type: "number", proOnly: false },
    { key: "HOSP_Operator_Brand", label: "Operator / Brand", type: "text", proOnly: false },
    { key: "HOSP_Room_Types", label: "Room Types", type: "text", proOnly: false },
    { key: "HOSP_Year_Built_Renovated", label: "Built / Renovated", type: "text", proOnly: false },
    { key: "Listed_Price", label: "Listed Price", type: "number", proOnly: false },
    { key: "HOSP_ADR", label: "ADR (₱)", type: "number", proOnly: true },
    { key: "HOSP_Occupancy_Rate", label: "Occupancy Rate (%)", type: "number", proOnly: true },
    { key: "HOSP_RevPAR", label: "RevPAR (₱)", type: "number", proOnly: true },
    { key: "HOSP_Cap_Rate", label: "Cap Rate (%)", type: "number", proOnly: true },
    { key: "HOSP_GFA", label: "GFA (sqm)", type: "number", proOnly: true },
    { key: "HOSP_Land_Area", label: "Land Area (sqm)", type: "number", proOnly: true },
  ],
  restaurants: [
    { key: "RST_Floor_Area_Sqm", label: "Floor Area (sqm)", type: "number", proOnly: false },
    { key: "RST_Seating_Capacity", label: "Seating capacity", type: "number", proOnly: false },
    { key: "RST_Kitchen_Condition", label: "Kitchen condition", type: "select", options: ["With Kitchen", "Bare", "Needs Build-out"], proOnly: false },
    { key: "RST_Foot_Traffic", label: "Foot traffic", type: "select", options: ["Low", "Medium", "High"], proOnly: false },
    { key: "RST_Frontage", label: "Storefront frontage", type: "text", proOnly: false },
    { key: "RST_Indoor_Outdoor", label: "Indoor / Outdoor", type: "text", proOnly: false },
    { key: "RST_Previous_Use", label: "Previous Use", type: "text", proOnly: false },
    { key: "RST_Rent", label: "Rent (₱/mo)", type: "number", proOnly: false },
    { key: "RST_Dues_CUSA", label: "Dues / CUSA (₱/mo)", type: "number", proOnly: false },
    { key: "RST_Hood_Exhaust", label: "Hood / exhaust present", type: "checkbox", proOnly: true },
    { key: "RST_Grease_Trap", label: "Grease trap present", type: "checkbox", proOnly: true },
    { key: "RST_Gas_Line", label: "Gas line available", type: "checkbox", proOnly: true },
    { key: "RST_Power_Capacity", label: "Power Capacity", type: "number", proOnly: true },
    { key: "RST_Delivery_Access", label: "Delivery Access", type: "text", proOnly: true },
    { key: "RST_Liquor_License", label: "Liquor license eligible", type: "text", proOnly: true },
    { key: "RST_FB_Zoning_Permit", label: "F&B Zoning Permit", type: "text", proOnly: true },
    { key: "RST_Ceiling_Height", label: "Ceiling Height", type: "text", proOnly: true },
    { key: "RST_Turnover_Condition", label: "Turnover Condition", type: "text", proOnly: true },
    { key: "RST_Parking", label: "Parking", type: "text", proOnly: true },
  ],
  venues: [
    { key: "VEN_Capacity_Seated", label: "Seated capacity", type: "number", proOnly: false },
    { key: "VEN_Capacity_Standing", label: "Standing capacity", type: "number", proOnly: false },
    { key: "VEN_Floor_Area_Sqm", label: "Floor Area (sqm)", type: "number", proOnly: false },
    { key: "VEN_Min_Booking_Hours", label: "Min Booking (hrs)", type: "number", proOnly: false },
    { key: "VEN_Indoor_Outdoor", label: "Indoor / Outdoor", type: "text", proOnly: false },
    { key: "VEN_Air_Conditioning", label: "Air-conditioned", type: "text", proOnly: false },
    { key: "VEN_Catering_Policy", label: "Catering policy", type: "select", options: ["In-house only", "External allowed", "Both"], proOnly: false },
    { key: "VEN_Rental_Rate", label: "Rental Rate (₱)", type: "number", proOnly: false },
    { key: "VEN_Rate_Basis", label: "Rate Basis", type: "text", proOnly: false },
    { key: "VEN_Layout_Configs", label: "Layout configurations", type: "text", proOnly: true },
    { key: "VEN_Ceiling_Height", label: "Ceiling Height", type: "text", proOnly: true },
    { key: "VEN_AV_Equipment", label: "AV equipment included", type: "text", proOnly: true },
    { key: "VEN_Power_Capacity", label: "Power Capacity", type: "text", proOnly: true },
    { key: "VEN_Parking", label: "Parking", type: "text", proOnly: true },
    { key: "VEN_Accessibility", label: "Accessibility", type: "text", proOnly: true },
    { key: "VEN_Noise_Curfew", label: "Noise curfew", type: "text", proOnly: true },
  ],
};

export default function DeepIntelligenceStudio({ onPublish, onClose, isEditing, initialData }) {
  // State initialization
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category: initialData?.category || initialData?.spaceCategory || "",
    location: initialData?.location || "",
    price: initialData?.price || "", // Internal price
    mediaLink: initialData?.mediaLink || "",
    photos: initialData?.photos || ["", "", "", "", ""],
    image: initialData?.image || (initialData?.photos && initialData?.photos[0]) || "", 
    description: initialData?.description || initialData?.desc || "",
    verified: initialData?.verified || false,
    details: initialData?.details || {},
  });

  const [lastSaved, setLastSaved] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvBlueprint, setCsvBlueprint] = useState(null);
  const [expandedUnitIdx, setExpandedUnitIdx] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);

  // Resizer state
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const isE2E = currentUser?.id === 'master-dev';

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

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
        title: "", category: "", location: "", price: "", mediaLink: "", image: "", photos: ["", "", "", "", ""], description: "", verified: false, details: {},
      });
      setLastSaved(null);
      setStep(1);
    }
  };

  const handleDragOver = (e) => { 
    e.preventDefault(); 
    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].type.startsWith('image/')) {
          return;
        }
      }
    }
    setIsDragging(true); 
  };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files[0].type.startsWith('image/')) return;
      await processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processPdfFile(e.target.files[0]);
    }
  };

  const processPdfFile = async (file) => {
    if (file.type !== "application/pdf") {
      setExtractionError("Please upload a PDF file.");
      return;
    }
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const form = new FormData();
      form.append("file", file);

      // 1. Extract Text
      const readRes = await fetch("/api/ai/read-pdf", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      if (!readRes.ok) {
        const errorData = await readRes.json();
        throw new Error(errorData.error || "Failed to read PDF");
      }
      const { text } = await readRes.json();

      // 2. Assimilate
      const assimilateRes = await fetch("/api/ai/assimilate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: [{ source: file.name, text }] }),
      });

      if (!assimilateRes.ok) throw new Error("Assimilation failed");
      
      const { drafts } = await assimilateRes.json();
      if (drafts && drafts.length > 0) {
        const draft = drafts[0];
        setFormData(prev => ({
          ...prev,
          title: draft.title || prev.title,
          location: draft.location || prev.location,
          category: draft.space_category || prev.category,
          price: draft.price || prev.price,
          description: draft.description || prev.description,
          details: { ...prev.details, ...draft.details }
        }));
      }
    } catch (err) {
      console.error(err);
      setExtractionError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const mustHaves = useMemo(() => ({
    title: !!formData.title.trim(),
    category: !!formData.category,
    location: !!formData.location.trim(),
    price: !!String(formData.price).trim(),
    media: formData.photos ? formData.photos.filter(p => p.trim()).length >= 5 : false
  }), [formData.title, formData.category, formData.location, formData.price, formData.photos]);
  const isPublishable = Object.values(mustHaves).every(Boolean);

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const setDetail = (key, value) => setFormData((prev) => ({
    ...prev,
    details: { ...prev.details, [key]: value },
  }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categoryFields = CATEGORY_FIELDS[formData.category] || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deepIntelFields = DEEP_INTEL_SCHEMA[formData.category || "commercial"] || {};

  const completionStats = useMemo(() => {
    let total = categoryFields.length;
    let filled = 0;

    categoryFields.forEach(f => {
      const val = formData.details[f.key];
      if (val !== undefined && val !== null && String(val).trim() !== "") filled++;
    });

    Object.values(deepIntelFields).forEach(stepFields => {
      stepFields.forEach(f => {
        total++;
        const val = formData.details[f.key];
        if (val !== undefined && val !== null && String(val).trim() !== "") filled++;
      });
    });

    // Add mustHaves
    total += 4; // title, location, price, media
    if (formData.title.trim()) filled++;
    if (formData.location.trim()) filled++;
    if (String(formData.price).trim()) filled++;
    if (formData.photos && formData.photos.filter(p => p.trim()).length >= 5) filled++;

    return { total, filled, percentage: total === 0 ? 100 : Math.round((filled / total) * 100) };
  }, [formData, categoryFields, deepIntelFields]);

  const jumpToEmptyField = () => {
    const scrollOpts = { behavior: 'smooth', block: 'center' };
    
    // 1. Basic fields (Step 1)
    if (!formData.title.trim()) { if (step !== 1) setStep(1); setTimeout(() => document.getElementById('field-title')?.scrollIntoView(scrollOpts), 100); return; }
    if (!formData.location.trim()) { if (step !== 1) setStep(1); setTimeout(() => document.getElementById('field-location')?.scrollIntoView(scrollOpts), 100); return; }
    if (!String(formData.price).trim()) { if (step !== 1) setStep(1); setTimeout(() => document.getElementById('field-price')?.scrollIntoView(scrollOpts), 100); return; }
    if (!formData.photos || formData.photos.filter(p => p.trim()).length < 5) { if (step !== 1) setStep(1); setTimeout(() => document.getElementById('field-photos')?.scrollIntoView(scrollOpts), 100); return; }

    // 2. Category fields (Step 1)
    for (const f of categoryFields) {
      const val = formData.details[f.key];
      if (val === undefined || val === null || String(val).trim() === "") {
        if (step !== 1) setStep(1);
        setTimeout(() => document.getElementById(`field-${f.key}`)?.scrollIntoView(scrollOpts), 100);
        return;
      }
    }

    // 3. Deep Intel fields (Steps 2-6)
    for (let s = 2; s <= 6; s++) {
      const fields = deepIntelFields[s] || [];
      for (const f of fields) {
        const val = formData.details[f.key];
        if (val === undefined || val === null || String(val).trim() === "") {
          if (step !== s) setStep(s);
          setTimeout(() => document.getElementById(`field-${f.key}`)?.scrollIntoView(scrollOpts), 100);
          return;
        }
      }
    }
  };

  const handlePublish = () => {
    if (isPublishable) {
      if (!isEditing) localStorage.removeItem("scoutit_listing_draft");
      onPublish(sanitizeObject(formData), true);
    }
  };

  const handleSaveDraft = () => {
    if (mustHaves.title) {
      if (!isEditing) localStorage.removeItem("scoutit_listing_draft");
      onPublish(sanitizeObject(formData), false);
    }
  };

  const draftData = useMemo(() => {
    return {
      title: formData.title || "Untitled Property",
      location: formData.location || "Location TBD",
      price: formData.price || 0,
      description: formData.description,
      spaceCategory: formData.category,
      category: formData.category,
      photos: formData.photos && formData.photos.some(p => p.trim()) ? formData.photos.filter(p => p.trim()) : (formData.image ? [formData.image] : []),
      
      // Map basic space specs to root so the Preview (Flows) can read them
      beds: formData.details?.Beds || formData.details?.Bedrooms || 0,
      baths: formData.details?.Baths || formData.details?.Bathrooms || 0,
      floor_sqm: formData.details?.Floor_Area_Sqm || formData.details?.Indoor_Sqm || 0,
      lot_sqm: formData.details?.Lot_Area_Sqm || formData.details?.Alfresco_Sqm || 0,
      parking: formData.details?.Parking_Slots || 0,
      guest_capacity: formData.details?.Guest_Capacity || 0,
      cleaning_time: formData.details?.Cleaning_Time || 0,
      accommodations: formData.details?.Accommodations || "",
      event_capacity: formData.details?.Event_Capacity || formData.details?.Seating_Capacity || 0,
      rooms: formData.details?.Rooms || 0,
      ceiling_height_text: formData.details?.Ceiling_Height || "",
      turnoverDate: formData.details?.Turnover_Date || "",
      
      details: formData.details
    };
  }, [formData]);

  return (
    <div 
      className={`fixed inset-0 z-[1000] bg-background flex flex-col md:grid md:grid-rows-[auto_1fr] overflow-hidden animate-[fadeIn_0.3s_ease-out] ${isResizing ? 'select-none pointer-events-none' : ''}`}
      style={{ gridTemplateColumns: `calc(${leftWidth}% - 5px) 10px calc(${100 - leftWidth}% - 5px)` }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Mobile Tab Bar */}
      <div className="md:hidden flex bg-surface border-b border-surface-variant z-50">
        <button 
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-3 text-xs font-label-caps tracking-widest uppercase transition-colors ${mobileTab === 'editor' ? 'text-gold-accent border-b-2 border-gold-accent' : 'text-text-secondary'}`}
        >
          Editor
        </button>
        <button 
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-3 text-xs font-label-caps tracking-widest uppercase transition-colors ${mobileTab === 'preview' ? 'text-gold-accent border-b-2 border-gold-accent' : 'text-text-secondary'}`}
        >
          Live Preview
        </button>
      </div>

      {/* Editor Pane (Left on Desktop) */}
      <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} md:flex md:col-start-1 md:row-start-1 md:row-span-2 flex-col overflow-hidden relative pointer-events-auto`}>

      {/* Header */}
      <div className="p-4 border-b border-surface-variant bg-background flex justify-between items-center z-20">
        <button className="text-text-secondary hover:text-on-surface font-working-title text-sm" onClick={onClose}>
          ← {isEditing ? "Cancel" : "Exit"}
        </button>
        
        <div className="flex items-center gap-4">
          {!isEditing && lastSaved && (
            <button onClick={clearDraft} className="text-error/80 hover:text-error text-[10px] uppercase font-label-caps tracking-wider transition-colors">
              Delete draft
            </button>
          )}
          <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase">
            {isEditing ? "Edit Deep Intel" : "New Deep Intel Dossier"}
          </span>
        </div>
      </div>

      <div 
        className="w-full bg-surface-variant h-3 cursor-pointer relative group flex overflow-hidden"
        onClick={jumpToEmptyField}
        title="Click to jump to next empty field"
      >
        <div className="bg-gold-accent/40 h-3 transition-all duration-300 absolute top-0 left-0" style={{ width: `${(step / 6) * 100}%` }}></div>
        <div className="bg-success h-3 transition-all duration-300 relative z-10" style={{ width: `${completionStats.percentage}%` }}></div>
        <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors z-20 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-[10px] font-mono text-white bg-black/50 px-2 rounded backdrop-blur">JUMP TO NEXT EMPTY FIELD</span>
        </div>
      </div>
      
      <div className="w-full bg-surface text-center py-1 border-b border-surface-variant">
        <span className="text-[10px] font-mono text-text-secondary">
          VAULT COMPLETION: <span className={completionStats.percentage >= 100 ? "text-success" : "text-gold-accent"}>{completionStats.percentage}%</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-surface flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {extractionError && (
            <div className="bg-error/10 border border-error/30 text-error p-3 rounded text-sm mb-6">
              <strong>AI Extraction Error:</strong> {extractionError}
            </div>
          )}

          {/* STEP 1: The Space */}
          {step === 1 && (
            <section className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
              <h3 className="font-headline-editorial text-3xl text-gold-accent border-b border-surface-variant pb-2">Step 1: The Space</h3>
              <p className="text-sm text-text-secondary">Let&apos;s start with the absolute must-haves and core spatial financials.</p>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Asset Category <span className="text-error">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      className={`flex flex-col items-center justify-center gap-2 px-3 py-6 rounded border text-sm transition-colors ${formData.category === c.id ? 'bg-surface-container-low border-gold-accent text-gold-accent shadow-[0_0_15px_rgba(232,174,60,0.15)]' : 'bg-surface-alt border-surface-variant text-on-surface hover:border-gold-accent/50'}`}
                      onClick={() => setField("category", c.id)}
                    >
                      <span className="text-2xl">{c.icon}</span> {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Property Title <span className="text-error">*</span></label>
                <input 
                  id="field-title"
                  className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setField("title", e.target.value)} 
                  placeholder="e.g. Premium High-Rise Office in BGC Core" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Location / Address <span className="text-error">*</span></label>
                <input 
                  id="field-location"
                  className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                  type="text" 
                  value={formData.location} 
                  onChange={e => setField("location", e.target.value)} 
                  placeholder="e.g. BGC Core" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Listed Price (₱) <span className="text-error">*</span></label>
                <input 
                  id="field-price"
                  className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                  type="number" 
                  value={formData.price} 
                  onChange={e => setField("price", e.target.value)} 
                  placeholder="e.g. 50000" 
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Property Photos (Min. 5 required) <span className="text-error">*</span></label>
                <PhotoUploader 
                  photos={formData.photos} 
                  onChange={(newPhotos) => setField("photos", newPhotos)}
                  onSetImage={(url) => setField("image", url)}
                />
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Space Specs <span className="text-error">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 mb-6 border-b border-surface-variant pb-6">
                  {categoryFields.map(field => (
                    <div key={field.key} className="flex flex-col gap-2">
                      <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">{field.label}</label>
                      <input 
                        id={`field-${field.key}`}
                        className="bg-surface-alt border border-surface-variant rounded px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-gold-accent transition-colors" 
                        type={field.type} 
                        value={formData.details[field.key] || ''} 
                        onChange={e => setDetail(field.key, e.target.value)} 
                        placeholder={field.type === "number" ? "0" : ""}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {(DEEP_INTEL_SCHEMA[formData.category || "commercial"]?.[1] || []).map((field) => (
                  <div key={field.key} className="flex flex-col gap-2">
                    <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">{field.label}</label>
                    <input 
                      id={`field-${field.key}`}
                      className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:border-gold-accent transition-colors" 
                      type="text" 
                      value={formData.details[field.key] || ''} 
                      onChange={e => setDetail(field.key, e.target.value)} 
                      placeholder={field.placeholder} 
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* DYNAMIC STEPS 2-6 */}
          {[2, 3, 4, 5, 6].map(s => (
            step === s && (
              <section key={s} className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
                <h3 className="font-headline-editorial text-3xl text-gold-accent border-b border-surface-variant pb-2">
                  {s === 2 ? "Step 2: Location" : s === 3 ? "Step 3: Life Here" : s === 4 ? "Step 4: Where To?" : s === 5 ? "Step 5: Build Plans" : "Step 6: Units & Universe"}
                </h3>
                <p className="text-sm text-text-secondary">
                  {s === 2 ? "Site specifics, zoning, and orientation details." : 
                   s === 3 ? "Environmental and spatial comfort details for occupants." : 
                   s === 4 ? "Connectivity, mobility, and local neighborhood reach." : 
                   s === 5 ? "Engineering specifications, MEP constraints, and structural details." : 
                   "Availability, ownership lineage, and macro market conditions."}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(DEEP_INTEL_SCHEMA[formData.category || "commercial"]?.[s] || []).map((field) => (
                    <div key={field.key} className="flex flex-col gap-2 md:col-span-1">
                      <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">{field.label}</label>
                      <input 
                        id={`field-${field.key}`}
                        className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:border-gold-accent transition-colors" 
                        type={field.key === "DI_Hist_Tx" ? "textarea" : "text"} 
                        value={formData.details[field.key] || ''} 
                        onChange={e => setDetail(field.key, e.target.value)} 
                        placeholder={field.placeholder} 
                      />
                    </div>
                  ))}
                </div>
              </section>
            )
          ))}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-6 border-t border-surface-variant">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 rounded border border-surface-variant text-text-secondary text-sm font-label-caps tracking-widest uppercase hover:text-on-surface hover:border-text-secondary transition-colors"
              >
                ← Previous step
              </button>
            ) : <div></div>}

            <div className="flex gap-4">
              <button 
                onClick={handleSaveDraft}
                disabled={!mustHaves.title}
                className="px-6 py-2 rounded text-gold-accent text-sm font-label-caps tracking-widest uppercase hover:bg-gold-accent/10 disabled:opacity-50 transition-colors"
              >
                Save Draft
              </button>
              
              {step < 6 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !formData.category} // Must select category to proceed
                  className="px-6 py-2 rounded bg-gold-accent text-background text-sm font-label-caps tracking-widest uppercase hover:bg-gold-bright disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(232,174,60,0.2)]"
                >
                  Next Step →
                </button>
              ) : (
                <button 
                  onClick={handlePublish}
                  disabled={!isPublishable}
                  className="px-6 py-2 rounded bg-gold-accent text-background text-sm font-label-caps tracking-widest uppercase hover:bg-gold-bright disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(232,174,60,0.3)]"
                >
                  Publish listing
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
      </div>
      
      {/* Resizer */}
      <div 
        className="hidden md:flex md:col-start-2 md:row-start-1 md:row-span-2 cursor-col-resize items-center justify-center bg-surface-variant z-50 hover:bg-gold-accent transition-colors pointer-events-auto"
        onMouseDown={startResizing}
      >
        <div className="w-1 h-8 bg-on-surface/20 rounded-full"></div>
      </div>
      
      {/* Preview Pane (Right on Desktop) */}
      <div className={`${mobileTab === 'preview' ? 'block' : 'hidden'} md:block md:col-start-3 md:row-span-2 relative bg-surface-alt md:border-l border-surface-variant overflow-y-auto custom-scrollbar pointer-events-auto flex-1`}>
        <div className="absolute top-0 left-0 w-full z-50 bg-gold-accent text-background text-center py-1.5 font-label-caps text-[10px] tracking-[0.3em] font-bold shadow-md pointer-events-none">
          LIVE PREVIEW / DRAFT MODE
        </div>
        <div className="mt-10 opacity-90 md:scale-[0.98] origin-top transition-all pointer-events-auto">
          {['commercial', 'restaurants', 'venues'].includes(formData.category) ? (
            <CommercialFlow slug={null} draftData={draftData} isDraftMode={true} externalActiveTab={['space', 'location', 'life', 'whereto', 'buildplans', 'units'][step - 1]} />
          ) : (
            <ResidentialFlow slug={null} draftData={draftData} isDraftMode={true} externalActiveTab={['space', 'location', 'life', 'whereto', 'buildplans', 'units'][step - 1]} />
          )}
        </div>
      </div>

    </div>
  );
}
