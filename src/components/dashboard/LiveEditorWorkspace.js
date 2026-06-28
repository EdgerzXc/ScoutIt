"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import CommercialFlow from "../property/CommercialFlow";
import ResidentialFlow from "../property/ResidentialFlow";
import { sanitizeObject } from "../../lib/sanitize";
import { supabase } from "../../lib/supabaseClient";

const CATEGORIES = [
  { id: "residential", icon: "🏠", label: "Residential" },
  { id: "commercial", icon: "🏢", label: "Commercial" },
  { id: "str", icon: "🌙", label: "Short-Term Rental" },
  { id: "hospitality", icon: "🏨", label: "Hospitality" },
  { id: "restaurants", icon: "🍽️", label: "Restaurant" },
  { id: "venues", icon: "🎤", label: "Venue" },
];


export default function LiveEditorWorkspace({ onPublish, onClose, isEditing, initialData }) {
  // State initialization
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category: initialData?.category || initialData?.spaceCategory || "",
    location: initialData?.location || "",
    price: initialData?.price || "", // Internal price
    mediaLink: initialData?.mediaLink || "",
    image: initialData?.image || (initialData?.photos && initialData?.photos[0]) || "", 
    description: initialData?.description || initialData?.desc || "",
    verified: initialData?.verified || false,
    details: initialData?.details || {},
  });

  const [lastSaved, setLastSaved] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);

  // Resizer state
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

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

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
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

  const mustHaves = {
    title: !!formData.title.trim(),
    category: !!formData.category,
    location: !!formData.location.trim(),
    price: !!String(formData.price).trim(),
    media: formData.photos ? formData.photos.filter(p => p.trim()).length >= 5 : false
  };
  const isPublishable = Object.values(mustHaves).every(Boolean);

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const setDetail = (key, value) => setFormData((prev) => ({
    ...prev,
    details: { ...prev.details, [key]: value },
  }));



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
      {/* Editor Pane (Left on Desktop) */}
      <div className="md:col-start-1 md:row-start-1 md:row-span-2 flex flex-col overflow-hidden relative pointer-events-auto">
      {/* AI Extraction Overlay */}
      {(isDragging || isExtracting) && (
        <div className="absolute inset-0 z-[2000] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-gold-accent transition-all">
          {isExtracting ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <div className="text-gold-accent">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <h2 className="text-2xl font-headline-editorial text-gold-accent">The AI Council is analyzing your document...</h2>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="text-gold-accent">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h2 className="text-2xl font-headline-editorial text-gold-accent">Drop PDF Brochure to Auto-fill</h2>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-surface-variant bg-background flex justify-between items-center z-20">
        <button className="text-text-secondary hover:text-on-surface font-working-title text-sm" onClick={onClose}>
          ← {isEditing ? "Cancel" : "Exit"}
        </button>
        
        <div className="flex items-center gap-4">
          <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="text-gold-accent hover:text-gold-accent/80 text-[10px] uppercase font-label-caps tracking-wider transition-colors border border-gold-accent/30 rounded px-2 py-1"
          >
            Upload PDF (Auto-fill)
          </button>
          {!isEditing && lastSaved && (
            <button onClick={clearDraft} className="text-error/80 hover:text-error text-[10px] uppercase font-label-caps tracking-wider transition-colors">
              Clear Draft
            </button>
          )}
          <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase">
            {isEditing ? "Edit Dossier" : "New Property Draft"}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-variant h-1">
        <div className="bg-gold-accent h-1 transition-all duration-300" style={{ width: `100%` }}></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-surface flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {extractionError && (
            <div className="bg-error/10 border border-error/30 text-error p-3 rounded text-sm mb-6">
              <strong>AI Extraction Error:</strong> {extractionError}
            </div>
          )}

          {/* Core Identity */}
          <section className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
            <h3 className="font-headline-editorial text-3xl text-gold-accent border-b border-surface-variant pb-2">Basic Property Information</h3>
            <p className="text-sm text-text-secondary">Input the bare minimum details here. You can enhance this listing later using the Deep Intelligence Studio.</p>
            
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
                className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
                type="number" 
                value={formData.price} 
                onChange={e => setField("price", e.target.value)} 
                placeholder="e.g. 50000" 
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Property Photos (Min. 5 required) <span className="text-error">*</span></label>
              <div className="flex flex-col gap-2">
                {(formData.photos || ["", "", "", "", ""]).map((photoUrl, index) => (
                  <div key={index} className="flex gap-2">
                    <input 
                      className="bg-surface-alt border border-surface-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors flex-1" 
                      type="text" 
                      value={photoUrl || ''} 
                      onChange={e => {
                        const newPhotos = [...(formData.photos || ["", "", "", "", ""])];
                        newPhotos[index] = e.target.value;
                        setField("photos", newPhotos);
                        if (index === 0) {
                           setField("image", e.target.value); // Keep backwards compatibility
                        }
                      }} 
                      placeholder={`Photo URL ${index + 1}${index === 0 ? ' (Primary)' : ''}`} 
                    />
                    {(formData.photos || []).length > 5 && (
                      <button 
                        className="px-3 border border-error/50 text-error hover:bg-error/10 rounded transition-colors"
                        onClick={() => {
                          const newPhotos = (formData.photos || ["", "", "", "", ""]).filter((_, i) => i !== index);
                          setField("photos", newPhotos);
                          if (index === 0) setField("image", newPhotos[0] || "");
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  className="mt-2 py-2 border border-dashed border-gold-accent/50 text-gold-accent hover:bg-gold-accent/10 rounded text-sm font-label-caps tracking-widest uppercase transition-colors"
                  onClick={() => {
                    setField("photos", [...(formData.photos || ["", "", "", "", ""]), ""]);
                  }}
                >
                  + Add Another Photo
                </button>
              </div>
            </div>
          </section>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-6 border-t border-surface-variant">
            <div></div>

            <div className="flex gap-4">
              <button 
                onClick={handleSaveDraft}
                disabled={!mustHaves.title}
                className="px-6 py-2 rounded text-gold-accent text-sm font-label-caps tracking-widest uppercase hover:bg-gold-accent/10 disabled:opacity-50 transition-colors"
              >
                Save Draft
              </button>
              
              <button 
                onClick={handlePublish}
                disabled={!isPublishable}
                className="px-6 py-2 rounded bg-gold-accent text-background text-sm font-label-caps tracking-widest uppercase hover:bg-[#F7C64E] disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(232,174,60,0.3)]"
              >
                Submit Basic Info
              </button>
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
      <div className="hidden md:block md:col-start-3 md:row-span-2 relative bg-surface-alt border-l border-surface-variant overflow-y-auto custom-scrollbar pointer-events-auto">
        <div className="absolute top-0 left-0 w-full z-50 bg-gold-accent text-background text-center py-1.5 font-label-caps text-[10px] tracking-[0.3em] font-bold shadow-md pointer-events-none">
          LIVE PREVIEW / DRAFT MODE
        </div>
        <div className="mt-10 opacity-90 md:scale-[0.98] origin-top transition-all pointer-events-auto">
          {['commercial', 'restaurants', 'venues'].includes(formData.category) ? (
            <CommercialFlow slug={null} draftData={draftData} isDraftMode={true} externalActiveTab={'space'} />
          ) : (
            <ResidentialFlow slug={null} draftData={draftData} isDraftMode={true} externalActiveTab={'space'} />
          )}
        </div>
      </div>

    </div>
  );
}
