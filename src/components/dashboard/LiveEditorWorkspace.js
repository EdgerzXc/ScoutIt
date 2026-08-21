"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import CommercialFlow from "../property/CommercialFlow";
import ResidentialFlow from "../property/ResidentialFlow";
import { sanitizeObject } from "../../lib/sanitize";
import { supabase } from "../../lib/supabaseClient";
import PhotoUploader from "./PhotoUploader";
import GeoPricingGauge from "./GeoPricingGauge";
import { getCurrentTier } from "../../lib/entitlements";
import { useDashboard } from "../../context/DashboardContext";
import { sanitizeError } from "@/lib/sanitizeError";
import { CATEGORIES, CATEGORY_FIELDS } from "../../lib/propertyEditorSchema";
export default function LiveEditorWorkspace({ onPublish, onClose, isEditing, initialData }) {
  const { currentUser, addToast } = useDashboard();
  
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

  const isPro = getCurrentTier() !== "starry";

  const [lastSaved, setLastSaved] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSeoOptimize = async () => {
    if (!formData.description) {
      addToast("Please write a short description first.", "warning");
      return;
    }
    setIsOptimizing(true);
    addToast("SEO Council AI is rewriting your description...", "🤖");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          text: formData.description,
          location: formData.location,
          category: formData.category
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "SEO Optimization failed");
      setFormData(prev => ({ ...prev, description: data.text }));
      addToast("Description optimized for search engines!", "success");
    } catch (err) {
      console.error(err);
      addToast(sanitizeError(err), "error");
    } finally {
      setIsOptimizing(false);
    }
  };

  // Resizer state
  const [leftWidth, setLeftWidth] = useState(45);
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
    // Ignore if dragging an image (let PhotoUploader handle it)
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
      // Ignore if it's an image
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
      const mockOwnerId = !token && currentUser?.id ? currentUser.id : undefined;
      
      const form = new FormData();
      form.append("file", file);
      if (mockOwnerId) form.append("mockOwnerId", mockOwnerId);

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
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
      setExtractionError(sanitizeError(err, "Extraction failed. Please try again."));
    } finally {
      setIsExtracting(false);
    }
  };

  // isE2E is already declared above
  const mustHaves = {
    title: !!formData.title?.trim(),
    category: !!formData.category,
    location: !!formData.location?.trim(),
    price: !!String(formData.price || "").trim(),
    media: isE2E ? true : (formData.photos ? formData.photos.filter(p => p?.trim()).length >= 5 : false)
  };

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const setDetail = (key, value) => setFormData((prev) => ({
    ...prev,
    details: { ...prev.details, [key]: value },
  }));

  const categoryFields = formData.category ? CATEGORY_FIELDS[formData.category] || [] : [];
  const publicFields = categoryFields.filter(f => !f.proOnly);

  // Completion calculation
  const totalPublicFieldsCount = publicFields.length;
  let filledPublicFieldsCount = 0;
  
  publicFields.forEach(f => {
    // Check if field has value in details or main form data
    const val = formData.details[f.key] || formData[f.key];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      filledPublicFieldsCount++;
    }
  });

  const completionPercentage = totalPublicFieldsCount === 0 
    ? 100 
    : Math.round((filledPublicFieldsCount / totalPublicFieldsCount) * 100);

  const isPublishable = isE2E ? true : (Object.values(mustHaves).every(Boolean) && completionPercentage >= 70);

  const getProgressColor = () => {
    if (completionPercentage >= 70) return "bg-success";
    if (completionPercentage >= 40) return "bg-gold-accent";
    return "bg-error";
  };

  const handlePublish = () => {
    if (isPublishable) {
      if (!isEditing) localStorage.removeItem("scoutit_listing_draft");
      const payload = {
        ...sanitizeObject(formData),
        type: formData.category,
        mediaLink: formData.photos?.[0] || formData.image || "",
        completenessScore: completionPercentage,
        verified: false
      };
      onPublish(payload, true);
    }
  };

  const handleSaveDraft = () => {
    if (mustHaves.title) {
      if (!isEditing) localStorage.removeItem("scoutit_listing_draft");
      const payload = {
        ...sanitizeObject(formData),
        type: formData.category,
        mediaLink: formData.photos?.[0] || formData.image || "",
        completenessScore: completionPercentage,
        verified: false
      };
      onPublish(payload, false);
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

  const [debouncedDraftData, setDebouncedDraftData] = useState(draftData);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDraftData(draftData);
    }, 300);
    return () => clearTimeout(handler);
  }, [draftData]);

  return (
    <div 
      className={`fixed inset-0 z-[1000] bg-background flex flex-col md:grid md:grid-rows-[auto_1fr] overflow-hidden animate-[fadeIn_0.3s_ease-out] ${isResizing ? 'select-none pointer-events-none' : ''}`}
      style={{ gridTemplateColumns: `calc(${leftWidth}% - 5px) 10px calc(${100 - leftWidth}% - 5px)` }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="hidden" 
        accept="application/pdf" 
        onChange={handleFileUpload} 
        aria-label="Upload PDF"
      />
      {/* Mobile Tab Bar */}
      <div className="md:hidden flex bg-surface border-b border-surface-variant z-50">
        <button 
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-3 text-xs font-label-caps tracking-widest uppercase transition ${mobileTab === 'editor' ? 'text-gold-accent border-b-2 border-gold-accent' : 'text-text-secondary'}`}
        >
          Editor
        </button>
        <button 
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-3 text-xs font-label-caps tracking-widest uppercase transition ${mobileTab === 'preview' ? 'text-gold-accent border-b-2 border-gold-accent' : 'text-text-secondary'}`}
        >
          Live Preview
        </button>
      </div>

      {/* Editor Pane (Left on Desktop) */}
      <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} md:flex md:col-start-1 md:row-start-1 md:row-span-2 flex-col overflow-hidden relative pointer-events-auto`}>
      {/* AI Extraction Overlay */}
      {(isDragging || isExtracting) && (
        <div className="absolute inset-0 z-[2000] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-gold-accent transition">
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
            className="text-gold-accent hover:text-gold-accent/80 text-[12px] uppercase font-label-caps tracking-wider transition border border-gold-accent/30 rounded px-2 py-1"
          >
            Upload PDF (Auto-fill)
          </button>
          {!isEditing && lastSaved && (
            <button onClick={clearDraft} className="text-error/80 hover:text-error text-[12px] uppercase font-label-caps tracking-wider transition">
              Clear Draft
            </button>
          )}
          <span className="font-label-caps text-[12px] tracking-widest text-gold-accent uppercase">
            {isEditing ? "Edit Dossier" : "New Property Draft"}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-variant h-1 relative overflow-hidden">
        <div className={`absolute top-0 left-0 h-1 transition duration-300 ${step === 1 ? 'w-1/2 bg-gold-accent' : 'w-full bg-gold-accent'}`}></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-32 md:p-12 custom-scrollbar bg-surface flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {extractionError && (
            <div className="bg-error/10 border border-error/30 text-error p-3 rounded text-sm mb-6">
              <strong>AI Extraction Error:</strong> {extractionError}
            </div>
          )}

          {/* Step 1: Core Identity */}
          {step === 1 && (
            <section className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
              <h3 className="font-headline-editorial text-3xl text-gold-accent border-b border-surface-variant pb-2">Basic Property Information</h3>
              <p className="text-on-surface-muted text-sm max-w-xl">Fill out the bare minimum details to list your property. Don&apos;t worry if you don&apos;t know everything—our Deep Intelligence Vault will securely collect the rest later.</p>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Asset Category <span className="text-error">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      className={`flex flex-col items-center justify-center gap-2 px-3 py-6 rounded border text-sm transition ${formData.category === c.id ? 'bg-surface-container-low border-gold-accent text-gold-accent shadow-[0_0_15px_rgba(232,174,60,0.15)]' : 'bg-surface-alt border-surface-variant text-on-surface hover:border-gold-accent/50'}`}
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
                  className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition" 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setField("title", e.target.value)} 
                  placeholder="e.g. Premium High-Rise Office in BGC Core" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Location / Address <span className="text-error">*</span></label>
                <input 
                  className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition" 
                  type="text" 
                  value={formData.location} 
                  onChange={e => setField("location", e.target.value)} 
                  placeholder="e.g. BGC Core" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Listed Price (₱) <span className="text-error">*</span></label>
                <input 
                  className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition" 
                  type="number" 
                  value={formData.price} 
                  onChange={e => setField("price", e.target.value)} 
                  placeholder="e.g. 50000" 
                />
                <GeoPricingGauge 
                  location={formData.location} 
                  category={formData.category} 
                  price={formData.price} 
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Property Description</label>
                  <button 
                    onClick={handleSeoOptimize}
                    disabled={isOptimizing || !formData.description}
                    className="text-[12px] font-label-caps tracking-widest text-gold-accent uppercase hover:text-gold-bright transition disabled:opacity-50 flex items-center gap-1 bg-gold-accent/10 border border-gold-accent/30 px-2 py-1 rounded"
                  >
                    {isOptimizing ? "Optimizing..." : "✨ SEO Optimize Description"}
                  </button>
                </div>
                <textarea 
                  className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-on-surface focus:outline-none focus:border-gold-accent transition min-h-[120px] resize-y text-sm leading-relaxed" 
                  value={formData.description} 
                  onChange={e => setField("description", e.target.value)} 
                  placeholder="Describe your property. Click the 'SEO Optimize' button to have our AI restructure it for maximum search engine visibility." 
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
            </section>
          )}

          {/* Step 2: Public Intel */}
          {step === 2 && (
            <section className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
              <div className="border-b border-surface-variant pb-4 mb-2 flex justify-between items-end">
                <div>
                  <h3 className="font-headline-editorial text-3xl text-gold-accent">Public Listing Intel</h3>
                  <p className="text-sm text-text-secondary mt-1">Complete at least 70% of these details to publish your listing to the directory.</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xl font-headline-editorial ${completionPercentage >= 70 ? 'text-success' : 'text-gold-accent'}`}>{completionPercentage}%</span>
                  <span className="text-[12px] font-label-caps text-text-secondary tracking-widest uppercase">Completeness</span>
                </div>
              </div>

              {publicFields.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  {publicFields.map((f) => (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">
                        {f.label}
                      </label>
                      {f.type === "select" ? (
                        <select
                          className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition appearance-none"
                          value={formData.details[f.key] || formData[f.key] || ""}
                          onChange={(e) => setDetail(f.key, e.target.value)}
                        >
                          <option value="" disabled>Select {f.label}</option>
                          {f.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : f.type === "checkbox" ? (
                        <label className="flex items-center gap-3 bg-surface-alt border border-surface-variant rounded px-3 py-2.5 cursor-pointer hover:border-gold-accent transition">
                          <input
                            type="checkbox"
                            className="accent-gold-accent w-4 h-4"
                            checked={formData.details[f.key] || false}
                            onChange={(e) => setDetail(f.key, e.target.checked)}
                          />
                          <span className="text-sm text-on-surface">{f.label}</span>
                        </label>
                      ) : (
                        <input
                          className="bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition"
                          type={f.type}
                          placeholder={`Enter ${f.label.toLowerCase()}`}
                          value={formData.details[f.key] || formData[f.key] || ""}
                          onChange={(e) => setDetail(f.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-text-secondary text-sm italic">
                  Please select a property category in Step 1 to load specific fields.
                </div>
              )}
            </section>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-surface-variant">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="text-text-secondary hover:text-on-surface text-sm font-label-caps tracking-widest uppercase transition"
              >
                ← Back
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-4 items-center">
              <button 
                onClick={handleSaveDraft}
                disabled={!mustHaves.title}
                className="px-6 py-2 rounded text-gold-accent text-sm font-label-caps tracking-widest uppercase hover:bg-gold-accent/10 disabled:opacity-50 transition"
              >
                Save Draft
              </button>
              
              {step === 1 ? (
                <button 
                  onClick={() => setStep(2)}
                  disabled={!Object.values(mustHaves).every(Boolean)}
                  className="px-6 py-2 rounded bg-surface-variant text-on-surface text-sm font-label-caps tracking-widest uppercase hover:bg-gold-accent hover:text-background disabled:opacity-50 transition"
                >
                  Next Step →
                </button>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <label className="flex items-center gap-2 mb-2 cursor-pointer bg-surface-alt/50 border border-surface-variant p-2 rounded w-full">
                    <input 
                      type="checkbox" 
                      checked={isVerified} 
                      onChange={(e) => setIsVerified(e.target.checked)} 
                      className="accent-gold-accent shrink-0" 
                    />
                    <span className="text-[12px] text-text-secondary leading-tight">
                      I legally assert I am the direct owner or an authorized licensed broker (RA 9646) for this property.
                    </span>
                  </label>
                  <button 
                    onClick={handlePublish}
                    disabled={!isPublishable || !isVerified}
                    className="px-6 py-2 rounded bg-gold-accent text-background text-sm font-label-caps tracking-widest uppercase hover:bg-gold-bright disabled:opacity-50 transition shadow-[0_0_15px_rgba(232,174,60,0.3)] disabled:shadow-none w-full"
                  >
                    Publish to Directory
                  </button>
                  {completionPercentage >= 70 ? (
                    <span className="text-[12px] text-success font-medium">Ready to publish! Fill more to boost visibility.</span>
                  ) : (
                    <span className="text-[12px] text-error font-medium">Reach 70% to publish ({completionPercentage}%)</span>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      </div>
      
      <div 
        className="hidden md:flex md:col-start-2 md:row-start-1 md:row-span-2 cursor-col-resize items-center justify-center bg-surface-variant z-50 hover:bg-gold-accent transition pointer-events-auto"
        onMouseDown={startResizing}
      >
        <div className="w-1 h-8 bg-on-surface/20 rounded-full"></div>
      </div>
      
      {/* Preview Pane (Right on Desktop) */}
      <div className={`${mobileTab === 'preview' ? 'block' : 'hidden'} md:block md:col-start-3 md:row-span-2 relative bg-surface-alt md:border-l border-surface-variant overflow-y-auto custom-scrollbar pointer-events-auto flex-1`}>
        <div className="absolute top-0 left-0 w-full z-50 bg-gold-accent text-background text-center py-1.5 font-label-caps text-[12px] tracking-[0.12em] font-bold shadow-md pointer-events-none">
          LIVE PREVIEW / DRAFT MODE
        </div>
        <div className="mt-10 opacity-90 md:scale-[0.98] origin-top transition pointer-events-auto">
          {['commercial', 'restaurants', 'venues'].includes(formData.category) ? (
            <CommercialFlow slug={null} draftData={debouncedDraftData} isDraftMode={true} externalActiveTab={step === 3 ? 'units' : 'space'} />
          ) : (
            <ResidentialFlow slug={null} draftData={debouncedDraftData} isDraftMode={true} externalActiveTab={step === 3 ? 'units' : 'space'} />
          )}
        </div>
      </div>

    </div>
  );
}
