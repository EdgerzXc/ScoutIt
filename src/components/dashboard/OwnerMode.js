"use client";

import { useState, useEffect, useRef, memo } from "react";
import LiveEditorWorkspace from "./LiveEditorWorkspace";
import DeepIntelligenceStudio from "./DeepIntelligenceStudio";
import BulkImporterMode from "./BulkImporterMode";
import { useDashboard } from "../../context/DashboardContext";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { sanitizeObject } from '../../lib/sanitize';
import { canSee, getCurrentTier } from '../../lib/entitlements';
import { supabase } from '../../lib/supabaseClient';
import DealTimeline from './crm/DealTimeline';
import { computeListingStrength } from '../../lib/listingStrength';

import OwnerListingCard from './cards/OwnerListingCard';

export default function OwnerMode() {
  const { listings, pitches, updatePitchStatus, addListing, addConciergeListing, bulkAddListings, addToast, updateListing, publishListing, closeListing, currentUser, inviteBroker, connects } = useDashboard();
  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "";
  const [showWizard, setShowWizard] = useState(false); // false | 'select_mode' | 'live_editor' | 'concierge' | 'edit'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAssimilating, setIsAssimilating] = useState(false);
  const [vaultTab, setVaultTab] = useState("url"); // "url" | "build"
  const [vaultBuildOption, setVaultBuildOption] = useState(null); // null | "self" | "team"
  const [vaultUrl, setVaultUrl] = useState("");
  const [canUseVault, setCanUseVault] = useState(false);
  useEffect(() => { setCanUseVault(canSee("vault", getCurrentTier())); }, []);
  
  // Bulk select for mass-archive on the Active Property Files grid.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isArchiving, setIsArchiving] = useState(false);
  // DashboardContext's `listings` isn't refetched after an archive call, so
  const [justArchivedIds, setJustArchivedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Check if current user has any listings (match the logged-in owner's id).
  // Archived (mass-deleted) listings are filtered out here rather than never
  // fetched, since the archive is a soft-delete via pipeline_status.
  const myListings = listings.filter(l => currentUser && l.ownerId === currentUser.id && l.pipelineStatus !== 'archived' && !justArchivedIds.includes(l.id));
  const hasListing = myListings.length > 0;

  // Private notes on an incoming pitch/deal -- same deals.private_notes
  // column BrokerMode.js's Deal File Workspace uses, debounced-saved here too.
  const [dealNotes, setDealNotes] = useState({});
  const noteSaveTimers = useRef({});
  const handleSaveDealNote = (dealId, note) => {
    setDealNotes(prev => ({ ...prev, [dealId]: note }));
    clearTimeout(noteSaveTimers.current[dealId]);
    noteSaveTimers.current[dealId] = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const mockOwnerId = !token && currentUser?.id ? currentUser.id : undefined;
        await fetch(`/api/deals/${dealId}/notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ note, mockOwnerId }),
        });
      } catch (err) {
        console.error('Failed to save deal notes', err);
      }
    }, 800);
  };

  // New Dossier State
  const [viewingDossierId, setViewingDossierId] = useState(null);
  const [inviteName, setInviteName] = useState("");

  const myListingsIds = myListings.map(l => l.id).join(',');

  // If they only have 1 listing, jump straight to its dossier
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get('edit');

    if (editId && myListings.find(l => l.id === editId)) {
      setViewingDossierId(editId);
      setShowWizard('edit');
      
      // Clean up URL so refresh doesn't keep triggering edit
      window.history.replaceState({}, '', '/dashboard');
    } else if (hasListing && myListings.length === 1 && !viewingDossierId) {
      setViewingDossierId(myListings[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasListing, myListings.length, myListingsIds, viewingDossierId]);

  // Handle cleanup if the active dossier is deleted
  useEffect(() => {
    if (viewingDossierId && !myListings.find(l => l.id === viewingDossierId)) {
      setViewingDossierId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myListings.length, myListingsIds, viewingDossierId]);

  const activeListing = myListings.find(l => l.id === viewingDossierId) || myListings[0];

  // Mobile bottom-bar primary action (+ List) opens the wizard
  useEffect(() => {
    const onPrimary = (e) => {
      if (e.detail?.mode === "owner") setShowWizard('select_mode');
    };
    window.addEventListener("scoutit:primary-action", onPrimary);
    return () => window.removeEventListener("scoutit:primary-action", onPrimary);
  }, []);

  // "List Property Now" from onboarding
  useEffect(() => {
    if (localStorage.getItem("scoutit_open_wizard") === "1") {
      localStorage.removeItem("scoutit_open_wizard");
      setShowWizard('select_mode');
    }
  }, []);

  const incomingPitches = activeListing 
    ? pitches.filter(p => p.isCurrentUserOwner && p.listingId === activeListing.id)
    : [];

  const handlePublish = async (listingData, isPublishing) => {
    let finalId = viewingDossierId;
    if (showWizard === 'edit' || showWizard === 'deep_intel_edit') {
      await updateListing(viewingDossierId, listingData);
    } else {
      const inserted = await addListing(listingData);
      if (inserted && inserted.id) {
         finalId = inserted.id;
      }
    }
    
    // If the user clicked "Publish to Live Feed", also hit the publish route
    if (isPublishing && finalId) {
       await publishListing(finalId);
    }
    
    setShowWizard(false);
  };

  if (showWizard === 'live_editor' || showWizard === 'edit') {
    return <LiveEditorWorkspace 
      onPublish={handlePublish} 
      onClose={() => setShowWizard(false)} 
      isEditing={showWizard === 'edit'} 
      initialData={showWizard === 'edit' ? activeListing : null} 
    />;
  }

  if (showWizard === 'deep_intel' || showWizard === 'deep_intel_edit') {
    return <DeepIntelligenceStudio 
      onPublish={handlePublish} 
      onClose={() => setShowWizard(false)} 
      isEditing={showWizard === 'deep_intel_edit'} 
      initialData={showWizard === 'deep_intel_edit' ? activeListing : null} 
    />;
  }

  if (showWizard === 'bulk') {
    return <BulkImporterMode onClose={() => setShowWizard(false)} />;
  }

  if (showWizard === 'select_mode') {
    return (
      <div className="max-w-[800px] mx-auto py-lg animate-[fadeIn_0.3s_ease]">
        <button onClick={() => setShowWizard(false)} className="text-text-secondary hover:text-gold-accent mb-8 font-working-title active:scale-95 transition-all inline-block">← Back to Dashboard</button>
        <h1 className="font-display-md text-4xl text-text-primary mb-2">How do you want to create your listing?</h1>
        <p className="text-text-secondary mb-8">Choose an option to get started.</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div 
            className="bg-surface-alt/40 backdrop-blur-md border border-surface-variant/50 rounded-xl p-8 hover:border-gold-accent hover:bg-surface-alt/80 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-lg"
            onClick={() => setShowWizard('bulk')}
          >
             <h3 className="font-working-title text-2xl text-on-surface mb-3 group-hover:text-gold-accent transition-colors">Upload Portfolio (CSV)</h3>
             <p className="text-sm text-text-secondary mb-6 leading-relaxed">Upload a CSV to generate multiple separate Property Drafts at once. Perfect for migrating large asset portfolios.</p>
             <span className="text-gold-accent font-label-caps text-[10px] tracking-widest border border-gold-accent/30 bg-gold-accent/10 px-3 py-1.5 rounded-full">RECOMMENDED FOR PROPERTY UPLOADS</span>
          </div>

          <div
            className={`bg-[#0d0d0d] backdrop-blur-xl border rounded-xl p-8 transition-all duration-500 relative overflow-hidden group ${canUseVault ? "border-gold-accent/20 hover:border-gold-accent/60 cursor-pointer" : "border-surface-variant cursor-not-allowed opacity-60"}`}
            onClick={() => canUseVault && setShowWizard('vip_vault')}
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-accent/5 rounded-full blur-3xl group-hover:bg-gold-accent/10 transition-all duration-700"></div>

            {/* Lock badge — visible when locked */}
            {!canUseVault && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-surface-alt border border-surface-variant rounded-full px-3 py-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">Cluster+</span>
              </div>
            )}

            <h3 className={`font-working-title text-2xl mb-3 drop-shadow-md ${canUseVault ? "text-gold-accent" : "text-text-secondary"}`}>The Spatial Vault</h3>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed group-hover:text-on-surface transition-colors">
              {canUseVault
                ? "Link a Matterport or Luma URL, or drop raw videos for our QuestIT Pros to convert into immersive 3D tours."
                : "Upgrade to Cluster or higher to unlock 360° tours, 3D maps, and drone heatmaps for your listing."}
            </p>

            {canUseVault ? (
              <span className="text-background font-label-caps font-bold text-[10px] tracking-widest bg-gold-accent px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(232,174,60,0.3)]">QUEST-IT ASSISTED</span>
            ) : (
              <Link href="/pricing/owner" className="inline-block text-gold-accent font-label-caps text-[10px] tracking-widest border border-gold-accent/40 bg-gold-accent/10 px-3 py-1.5 rounded-full hover:bg-gold-accent/20 active:scale-95 transition-all" onClick={e => e.stopPropagation()}>
                UPGRADE TO CLUSTER →
              </Link>
            )}
          </div>

          <div 
            className="bg-surface-alt/40 backdrop-blur-md border border-surface-variant/50 rounded-xl p-8 hover:border-text-primary hover:bg-surface-alt/80 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-lg"
            onClick={() => setShowWizard('concierge')}
          >
             <h3 className="font-working-title text-2xl text-on-surface mb-3 group-hover:text-white transition-colors">Upload Pitch Deck (PDF)</h3>
             <p className="text-sm text-text-secondary mb-6 leading-relaxed">Upload your existing pitch deck or PDF flyer. Our Council AI will extract the data and structure the dossier for your review.</p>
          </div>

          <div 
            className="bg-surface-alt/40 backdrop-blur-md border border-surface-variant/50 rounded-xl p-8 hover:border-text-primary hover:bg-surface-alt/80 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-lg"
            onClick={() => setShowWizard('live_editor')}
          >
             <h3 className="font-working-title text-2xl text-on-surface mb-3 group-hover:text-white transition-colors">Build from Scratch</h3>
             <p className="text-sm text-text-secondary mb-6 leading-relaxed">Build your listing manually using our step-by-step editor. Best if you don&apos;t have a deck and are starting from scratch.</p>
          </div>

          <div 
            className="bg-[#0d0d0d] backdrop-blur-md border border-gold-accent/20 rounded-xl p-8 hover:border-gold-accent/60 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            onClick={() => setShowWizard('deep_intel')}
          >
             <h3 className="font-working-title text-2xl text-gold-accent mb-3 group-hover:text-gold-bright transition-colors">Advanced Editor</h3>
             <p className="text-sm text-text-secondary mb-6 leading-relaxed">Unlock the hidden matrix. Manually override structural specs, input financial intelligence, and map advanced logistics.</p>
             <span className="text-gold-accent font-label-caps text-[10px] tracking-widest border border-gold-accent/30 bg-gold-accent/10 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(232,174,60,0.2)]">PRO MODE</span>
          </div>
        </div>

        {/* Power User Bypass */}
        <div className="mt-8 text-center animate-[fadeIn_0.5s_ease_0.2s]">
          <p className="text-text-secondary text-sm mb-2">Already know what you&apos;re doing?</p>
          <button 
            onClick={() => setShowWizard('live_editor')} 
            className="text-text-secondary hover:text-gold-accent border-b border-transparent hover:border-gold-accent/30 pb-0.5 font-working-title text-sm active:scale-95 inline-block transition-all"
          >
            Skip to Editor (Quick Add)
          </button>
        </div>
      </div>
    );
  }

  if (showWizard === 'concierge') {
    return (
      <div className="max-w-[600px] mx-auto py-lg animate-[fadeIn_0.3s_ease]">
        <button onClick={() => setShowWizard('select_mode')} className="text-text-secondary hover:text-gold-accent mb-8 font-working-title">← Back</button>
        <h1 className="font-display-md text-4xl text-text-primary mb-2">Upload Pitch Deck or PDF</h1>
        <p className="text-text-secondary mb-8">Upload your PDF. Our AI will automatically extract property details to create a draft.</p>
        
        <div className="bg-[#121110] border-2 border-dashed border-surface-variant rounded-lg p-12 text-center flex flex-col items-center relative transition-colors hover:border-gold-accent/50">
          <span className="text-4xl mb-4">📄</span>
          {selectedFile ? (
            <div className="mb-6 w-full">
              <div className="bg-surface-alt p-4 rounded border border-surface-variant flex items-center justify-between">
                <span className="text-on-surface font-working-title text-sm truncate">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-xs font-bold text-error hover:underline">Remove</button>
              </div>
            </div>
          ) : (
            <div className="mb-6 w-full">
              <p className="text-text-secondary mb-4">Drag and drop your PDF, or click to browse.</p>
              <input type="file" accept=".pdf" className="hidden" id="pdf-upload" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <label htmlFor="pdf-upload" className="cursor-pointer border border-gold-accent text-gold-accent font-working-title px-6 py-2 rounded hover:bg-gold-accent/10 transition-colors inline-block">
                Choose a PDF file
              </label>
            </div>
          )}

          <button
            className="w-full bg-gold-accent text-background font-working-title font-bold px-6 py-3 rounded hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all mt-4 flex items-center justify-center gap-2"
            disabled={!selectedFile || isAssimilating}
            onClick={async () => {
              if (!selectedFile) return;
              setIsAssimilating(true);
              addToast("Reading your PDF...", "📄");

              try {
                // 1. Extract the real text layer from the PDF (server-side via unpdf).
                //    FileReader.readAsText on a binary PDF returns garbage, so we
                //    send the file to /api/ai/read-pdf which does proper extraction.
                const pdfForm = new FormData();
                pdfForm.append('file', selectedFile);
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const pdfRes = await fetch('/api/ai/read-pdf', {
                  method: 'POST',
                  headers: { 'Authorization': token ? `Bearer ${token}` : "" },
                  body: pdfForm
                });
                const pdfData = await pdfRes.json();
                if (!pdfRes.ok) throw new Error(pdfData.error || 'Could not read PDF');
                const text = pdfData.text;

                addToast("AI is extracting property details...", "🧠");

                // 2. Hand the extracted text to the schema-mapping AI.
                const res = await fetch('/api/ai/assimilate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    source: 'pdf_concierge',
                    payload: [{ raw_text: text, filename: selectedFile.name }]
                  })
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Assimilation failed');

                const draft = result.drafts?.[0];
                if (draft) {
                  await addListing({
                    title: draft.title || selectedFile.name,
                    location: draft.location || '',
                    space_category: draft.space_category || 'commercial',
                    type: draft.space_category || 'commercial',
                    price: draft.price || null,
                    description: draft.description || '',
                    media_link: draft.media_link || '',
                    pipeline_status: 'pending',
                    details: { ...draft.details, ai_confidence: draft.confidence, ai_gaps: draft.gaps }
                  });
                  addToast(`Draft created with ${Math.round((draft.confidence || 0) * 100)}% confidence. Review and complete missing fields.`, "✅");
                }
              } catch (err) {
                console.error('[Concierge]', err);
                addToast(`AI extraction failed: ${err.message}`, "❌");
              } finally {
                setIsAssimilating(false);
                setSelectedFile(null);
                setShowWizard(false);
              }
            }}
          >
            {isAssimilating ? <><span className="animate-spin">⚙️</span> Extracting...</> : "Create draft from PDF"}
          </button>
        </div>
      </div>
    );
  }

  if (showWizard === 'vip_vault') {
    if (!canUseVault) {
      return (
        <div className="max-w-[600px] mx-auto py-lg animate-[fadeIn_0.4s_ease] flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-surface-alt border border-surface-variant rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-muted)" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <p className="font-label-caps text-[11px] tracking-widest text-gold-accent/60 uppercase mb-2">Cluster tier required</p>
            <h2 className="font-display-md text-3xl text-on-surface mb-3">The Spatial Vault</h2>
            <p className="text-text-secondary text-sm leading-relaxed max-w-sm">360° tours, 3D spatial maps, and drone heatmaps are a Cluster+ feature. Upgrade your Owner plan to unlock the full Vault experience for your listing.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowWizard('select_mode')} className="border border-surface-variant text-text-secondary font-working-title px-6 py-3 rounded hover:border-gold-accent/40 hover:text-on-surface active:scale-95 transition-all text-sm">← Back</button>
            <Link href="/pricing/owner" className="bg-gold-accent text-background font-working-title font-bold px-6 py-3 rounded hover:bg-gold-bright active:scale-95 transition-all text-sm tracking-wide">Upgrade to Cluster</Link>
          </div>
        </div>
      );
    }

    const isUrlValid = vaultUrl.trim().startsWith("http");

    const handleSaveUrl = async () => {
      if (!isUrlValid) return;
      if (activeListing) {
        await updateListing(activeListing.id, { matterportTourUrl: vaultUrl.trim() });
        addToast("Vault tour linked to your listing — it's live now.", "success");
      }
      setVaultUrl("");
      setShowWizard(false);
    };

    const handleSubmitVideo = async () => {
      if (!selectedFile) return;
      addToast("Uploading your video...", "🎬");

      try {
        const form = new FormData();
        form.append('file', selectedFile);
        form.append('owner_id', currentUser?.id || 'unknown');
        form.append('property_id', activeListing?.id || '');

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch('/api/storage/upload', { 
          method: 'POST', 
          headers: { 'Authorization': token ? `Bearer ${token}` : "" },
          body: form 
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.error || 'Upload failed');

        addToast("Video uploaded — your Spatial Tour will be ready in 3–5 days.", "✅");
      } catch (err) {
        console.error('[Vault upload]', err);
        addToast(`Upload failed: ${err.message}`, "❌");
        return;
      }

      setSelectedFile(null);
      setVaultBuildOption(null);
      setShowWizard(false);
    };

    const handleJoinQueue = async () => {
      await addConciergeListing(`[Vault — ScoutIt Team] ${activeListing?.title || "Property"}`);
      addToast("You're in the queue — our team will reach out to schedule your recording.", "success");
      setVaultBuildOption(null);
      setShowWizard(false);
    };

    const backLabel = vaultBuildOption ? "← Choose another option" : "← Back";
    const handleBack = () => {
      if (vaultBuildOption) { setVaultBuildOption(null); return; }
      setShowWizard('select_mode');
    };

    return (
      <div className="max-w-[700px] mx-auto py-lg animate-[fadeIn_0.5s_ease]">
        <button onClick={handleBack} className="text-text-secondary hover:text-gold-accent mb-8 font-label-caps uppercase tracking-widest transition-colors">{backLabel}</button>
        <h1 className="font-display-md text-5xl text-gold-accent mb-3 drop-shadow-md">The Spatial Vault</h1>
        <p className="text-text-secondary mb-10 font-working-title text-sm">Give buyers an immersive walk-through — 3D maps, 360° tours, AR experiences. No site visit wasted.</p>

        {/* ── TOP TAB: I have a URL / Build one for me ── */}
        <div className="flex gap-0 mb-8 rounded-lg overflow-hidden border border-surface-variant">
          <button
            onClick={() => { setVaultTab("url"); setVaultBuildOption(null); }}
            className={`flex-1 py-3 font-label-caps text-[11px] tracking-widest uppercase transition-all duration-200 ${vaultTab === "url" ? "bg-gold-accent text-background font-bold" : "bg-surface-alt text-text-secondary hover:text-on-surface"}`}
          >
            I already have a tour URL
          </button>
          <button
            onClick={() => { setVaultTab("build"); setVaultBuildOption(null); }}
            className={`flex-1 py-3 font-label-caps text-[11px] tracking-widest uppercase transition-all duration-200 ${vaultTab === "build" ? "bg-gold-accent text-background font-bold" : "bg-surface-alt text-text-secondary hover:text-on-surface"}`}
          >
            Build one for me
          </button>
        </div>

        {/* ══ PATH A: Already have a URL ══ */}
        {vaultTab === "url" && (
          <div className="bg-gradient-to-br from-[#1A1814] to-[#0A0908] border border-gold-accent/30 rounded-2xl p-10 flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
            <div>
              <p className="text-xs font-label-caps tracking-widest text-gold-accent uppercase mb-1">Accepted sources</p>
              <p className="text-sm text-text-secondary leading-relaxed">Matterport · Luma AI · Cupix · Zillow 3D · YouTube 360 · Any embeddable tour link</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Paste your tour URL</label>
              <input
                type="url"
                className="bg-surface-alt border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors text-sm"
                placeholder="https://my.matterport.com/show/?m=..."
                value={vaultUrl}
                onChange={e => setVaultUrl(e.target.value)}
              />
            </div>
            <div className="bg-surface-alt/50 border border-surface-variant rounded-lg p-4 text-xs text-text-secondary leading-relaxed">
              <strong className="text-on-surface font-working-title block mb-1">Goes live immediately</strong>
              Saved to your listing right away. Cluster+ buyers see the full immersive tour. Everyone else sees a blurred teaser that nudges them to upgrade.
            </div>
            <button
              onClick={handleSaveUrl}
              disabled={!isUrlValid}
              className="w-full bg-gold-accent text-background font-label-caps uppercase tracking-widest font-bold px-6 py-4 rounded hover:bg-gold-bright active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-300 text-base tracking-wide shadow-[0_0_20px_rgba(232,174,60,0.2)] hover:shadow-[0_0_30px_rgba(232,174,60,0.4)]"
            >
              Link to My Listing
            </button>
          </div>
        )}

        {/* ══ PATH B: Build one for me ══ */}
        {vaultTab === "build" && !vaultBuildOption && (
          <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease]">
            <p className="text-sm text-text-secondary mb-2">How do you want to get the footage?</p>

            {/* Option 1 — I'll record it myself */}
            <div
              onClick={() => setVaultBuildOption("self")}
              className="bg-gradient-to-br from-[#1A1814] to-[#0A0908] border border-surface-variant hover:border-gold-accent/60 rounded-xl p-7 cursor-pointer group transition-all duration-300 hover:shadow-[0_0_20px_rgba(232,174,60,0.08)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-gold-accent/50 transition-colors" />
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-gold-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 10l4.553-2.277A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14"/><rect x="3" y="7" width="12" height="10" rx="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-working-title text-lg text-on-surface group-hover:text-gold-accent transition-colors mb-1">I&apos;ll record it myself</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">Walk through your property with your phone and upload the raw video. Our team processes it into a full 3D tour — you just need to hit record.</p>
                </div>
              </div>
            </div>

            {/* Option 2 — ScoutIt Team records it */}
            <div
              onClick={() => setVaultBuildOption("team")}
              className="bg-gradient-to-br from-[#1A1814] to-[#0A0908] border border-surface-variant hover:border-gold-accent/60 rounded-xl p-7 cursor-pointer group transition-all duration-300 hover:shadow-[0_0_20px_rgba(232,174,60,0.08)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-gold-accent/50 transition-colors" />
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-gold-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-working-title text-lg text-on-surface group-hover:text-gold-accent transition-colors mb-1">ScoutIt Team records it for me</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">No video needed. Join the queue and our team will come to your property, record everything, and build the full 3D tour from scratch.</p>
                  <span className="inline-block mt-3 text-[10px] font-label-caps tracking-widest text-gold-accent/70 border border-gold-accent/30 bg-gold-accent/10 px-2.5 py-1 rounded-full">QUEUE — TYPICALLY 3–5 DAYS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ PATH B1: Self-record — video upload ══ */}
        {vaultTab === "build" && vaultBuildOption === "self" && (
          <div className="bg-[#0d0d0d] border border-gold-accent/20 rounded-2xl p-10 flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease]">
            <div className="bg-surface-alt/50 border border-gold-accent/20 rounded-lg p-5 w-full">
              <strong className="text-gold-accent font-label-caps uppercase tracking-widest text-sm block mb-1">JUST HIT RECORD</strong>
              <p className="text-sm text-text-secondary leading-relaxed">Walk through every room slowly with your phone camera. Upload the raw .mp4 or .mov — we&apos;ll stitch it into an immersive 3D tour and notify you when it&apos;s live, typically within 48 hours.</p>
            </div>

            {selectedFile ? (
              <div className="w-full bg-surface-alt/80 p-5 rounded-lg border border-gold-accent/40 flex items-center justify-between">
                <div>
                  <p className="text-gold-accent font-working-title text-sm truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-xs font-bold text-error hover:text-red-400 uppercase tracking-widest transition-colors">Remove</button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gold-accent/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(232,174,60,0.15)]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="text-text-secondary font-label-caps text-sm uppercase tracking-widest">Drag and drop your video here</p>
                <input type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" id="video-upload" onChange={e => setSelectedFile(e.target.files[0])} />
                <label htmlFor="video-upload" className="cursor-pointer border-2 border-gold-accent text-gold-accent font-label-caps uppercase tracking-widest font-bold px-8 py-3 rounded hover:bg-gold-accent hover:text-background transition-all duration-300">
                  Select Video File
                </label>
                <p className="text-[10px] text-text-secondary tracking-widest uppercase">Supported: .mp4, .mov — any file size</p>
              </div>
            )}

            <button
              onClick={handleSubmitVideo}
              disabled={!selectedFile}
              className="w-full bg-gold-accent text-background font-label-caps uppercase tracking-widest font-bold px-6 py-4 rounded hover:bg-gold-bright active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-300 text-base shadow-[0_0_20px_rgba(232,174,60,0.2)] hover:shadow-[0_0_30px_rgba(232,174,60,0.4)]"
            >
              Submit for Processing
            </button>
          </div>
        )}

        {/* ══ PATH B2: ScoutIt Team queue ══ */}
        {vaultTab === "build" && vaultBuildOption === "team" && (
          <div className="bg-[#0d0d0d] border border-gold-accent/20 rounded-2xl p-10 flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
            <div className="bg-surface-alt/50 border border-gold-accent/20 rounded-lg p-5">
              <strong className="text-gold-accent font-label-caps uppercase tracking-widest text-sm block mb-1">WE HANDLE EVERYTHING</strong>
              <p className="text-sm text-text-secondary leading-relaxed">Our team comes to your property, records the full walkthrough with professional equipment, and builds the 3D map and 360° tour. You just need to be available.</p>
            </div>

            <div className="flex flex-col gap-3 text-sm text-text-secondary">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gold-accent/20 border border-gold-accent/40 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span>Professional recording equipment</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gold-accent/20 border border-gold-accent/40 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span>Full 3D map + 360° tour built by our team</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gold-accent/20 border border-gold-accent/40 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span>We&apos;ll contact you within 24 hours to schedule</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gold-accent/20 border border-gold-accent/40 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span>Typical turnaround: 3–5 days from recording date</span>
              </div>
            </div>

            <div className="bg-surface-alt/50 border border-surface-variant rounded-lg p-4 text-xs text-text-secondary">
              <strong className="text-on-surface font-label-caps uppercase tracking-widest block mb-1">Included with your Cluster subscription</strong>
              Team recording is part of your Cluster+ plan. No extra charge — just join the queue.
            </div>

            <button
              onClick={handleJoinQueue}
              className="w-full bg-gold-accent text-background font-label-caps uppercase tracking-widest font-bold px-6 py-4 rounded hover:bg-gold-bright active:scale-95 transition-all duration-300 text-base shadow-[0_0_20px_rgba(232,174,60,0.2)] hover:shadow-[0_0_30px_rgba(232,174,60,0.4)]"
            >
              Join the Queue
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: ZERO LISTINGS ---
  if (!hasListing) {
    return (
      <div className="max-w-[1200px] mx-auto pt-16 md:pt-0 py-lg px-4 md:px-0 animate-[fadeIn_0.4s_ease]">
        <div className="mb-sm">
          <h1 className="font-display-md text-3xl md:text-5xl text-text-primary mb-2">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          <p className="text-text-secondary font-body-md text-sm md:text-base">Your workspace is empty.</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-lg border border-surface-variant px-4 py-16 md:p-lg flex flex-col gap-6 relative overflow-hidden items-center justify-center text-center md:py-32 mt-8 mx-4 md:mx-0">
          <h3 className="font-display-md text-2xl md:text-3xl text-on-surface px-2">Create your first listing</h3>
          <p className="text-text-secondary max-w-md text-sm md:text-base px-2">Build a complete property listing in under 10 minutes.</p>
          <button className="bg-gold-accent text-background font-label-caps uppercase tracking-widest px-6 py-3 md:px-8 md:py-4 rounded hover:bg-surface-tint active:scale-95 transition-all text-base md:text-lg font-bold shadow-[0_0_20px_rgba(232,174,60,0.2)] mt-2" onClick={() => setShowWizard('select_mode')}>
            Create your first listing
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: LAYER 1 - ACTIVE PROPERTY FILES (PORTFOLIO VIEW) ---
  if (!viewingDossierId && myListings.length > 1) {
    const filteredListings = myListings.filter(l => 
      !searchQuery || 
      l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedListings = filteredListings.reduce((acc, listing) => {
      const loc = listing.location || 'Unspecified Location';
      if (!acc[loc]) acc[loc] = [];
      acc[loc].push(listing);
      return acc;
    }, {});

    return (
      <div className="max-w-[1200px] mx-auto py-lg animate-slide-up-fade">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-surface-variant pb-6 gap-4">
          <div>
            <span className="font-label-caps text-gold-accent tracking-widest uppercase mb-2 block">Command Center</span>
            <h1 className="font-display-md text-3xl md:text-4xl text-text-primary">Active Listings</h1>
          </div>
          {/* Hidden on mobile — the contextual "+ List" FAB is the canonical add-listing control there (one control per action) */}
          <div className="flex gap-3 w-full md:w-auto">
            {selectMode && selectedIds.length > 0 && (
              <button
                className="border border-error text-error hover:bg-error hover:text-white font-label-caps uppercase tracking-widest font-bold px-5 py-3 rounded active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                disabled={isArchiving}
                onClick={async () => {
                  setIsArchiving(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    const mockOwnerId = !token && currentUser?.id ? currentUser.id : undefined;
                    const res = await fetch('/api/dashboard/archive', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                      body: JSON.stringify({ propertyIds: selectedIds, mockOwnerId }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to archive');
                    setJustArchivedIds(prev => [...prev, ...selectedIds]);
                    addToast(`Archived ${data.archivedCount} propert${data.archivedCount === 1 ? 'y' : 'ies'}.`, '🗑️');
                    setSelectedIds([]);
                    setSelectMode(false);
                  } catch (err) {
                    addToast(err.message || 'Failed to archive listings', '⚠️');
                  } finally {
                    setIsArchiving(false);
                  }
                }}
              >
                {isArchiving ? 'Archiving…' : `Archive selected listings (${selectedIds.length})`}
              </button>
            )}
            <button
              className="border border-surface-variant text-text-secondary hover:text-on-surface hover:border-text-secondary font-label-caps uppercase tracking-widest font-bold px-5 py-3 rounded transition-all"
              onClick={() => { setSelectMode(s => !s); setSelectedIds([]); }}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
            <button
              className="hidden md:inline-block border border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-background active:scale-95 font-label-caps uppercase tracking-widest font-bold px-6 py-3 rounded transition-all w-full md:w-auto"
              onClick={() => setShowWizard('select_mode')}
            >
              + New Property File
            </button>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search your properties..."
            className="w-full md:w-96 bg-surface border border-surface-variant rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-text-secondary py-8 text-center bg-surface-alt border border-surface-variant rounded-lg">
            No properties match your search.
          </div>
        ) : (
          <div className="flex flex-col gap-12 pb-4">
            {Object.keys(groupedListings).sort().map(location => (
              <div key={location}>
                <h2 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-4 border-b border-surface-variant pb-2">{location}</h2>
                <div className="flex overflow-x-auto snap-x md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                  {groupedListings[location].map((listing, index) => {
                    const listPitches = pitches.filter(p => p.isCurrentUserOwner && p.listingId === listing.id);
                    const pendingPitches = listPitches.filter(p => p.status === 'pending');
                    const isSelected = selectedIds.includes(listing.id);
                    const completeness = computeListingStrength(listing).score;
                    return (
                      <OwnerListingCard 
                        key={listing.id}
                        listing={listing}
                        pendingPitchesCount={pendingPitches.length}
                        isSelected={isSelected}
                        completeness={completeness}
                        selectMode={selectMode}
                        toggleSelected={toggleSelected}
                        setViewingDossierId={setViewingDossierId}
                        index={index}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: LAYER 2 - PROPERTY DOSSIER WORKSPACE ---
  return (
    <div className="max-w-[1200px] mx-auto py-4 animate-slide-up-fade">
      
      {/* Dossier Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-surface-variant pb-6 mb-8 gap-4">
        <div>
          {myListings.length > 1 && (
            <button 
              className="text-text-secondary hover:text-gold-accent text-sm font-label-caps uppercase tracking-widest flex items-center gap-2 mb-4 transition-colors"
              onClick={() => setViewingDossierId(null)}
            >
              ← Back to Active Files
            </button>
          )}
          <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-1 block">Property Dossier</span>
          <h1 className="font-display-md text-3xl md:text-5xl text-on-surface">{activeListing.title || 'Untitled Property'}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
           <button 
             className="border border-surface-variant text-text-secondary hover:text-on-surface hover:border-text-secondary font-label-caps uppercase tracking-widest font-bold px-4 py-2 rounded transition-colors text-sm flex-1 md:flex-none text-center justify-center"
             onClick={() => {
               if(window.confirm("Withdraw this property dossier from the market? Brokers will no longer see it.")) {
                 closeListing(activeListing.id);
               }
             }}
           >
             Withdraw
           </button>
           <button 
             className="border border-gold-accent text-gold-accent hover:bg-gold-accent/10 active:scale-95 font-label-caps uppercase tracking-widest font-bold px-4 py-2 rounded transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-none text-center justify-center"
             disabled={activeListing.pipelineStatus === 'ai_drafting'}
             onClick={() => setShowWizard('edit')}
           >
             Edit Workspace
           </button>
           <Link 
             href={`/dashboard/inventory/${activeListing.id}`}
             className="border border-gold-accent text-gold-accent hover:bg-gold-accent/10 font-label-caps uppercase tracking-widest font-bold px-4 py-2 rounded transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-none text-center justify-center"
           >
             Manage Inventory
           </Link>
           <button
             className="hidden md:inline-block border border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-background active:scale-95 font-label-caps uppercase tracking-widest font-bold px-4 py-2 rounded transition-all text-sm flex-1 md:flex-none text-center justify-center"
             onClick={() => setShowWizard('select_mode')}
           >
             + New Property
           </button>
           <button 
             className="bg-gold-accent/10 border border-gold-accent text-gold-accent hover:bg-gold-accent/20 active:scale-95 font-label-caps uppercase tracking-widest font-bold px-4 py-2 rounded transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-none text-center justify-center shadow-[0_0_10px_rgba(232,174,60,0.1)]"
             disabled={activeListing.pipelineStatus === 'ai_drafting'}
             onClick={() => setShowWizard('deep_intel_edit')}
           >
             Add Deep Intel
           </button>
           {activeListing.pipelineStatus !== 'ai_drafting' && (
             <Link href={`/property/${activeListing.slug || activeListing.id}`} className="bg-gold-accent text-background font-label-caps uppercase tracking-widest font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity text-sm flex-1 md:flex-none text-center justify-center">
               View Public File
             </Link>
           )}
        </div>
      </div>

      {activeListing.pipelineStatus === 'ai_drafting' && (
        <div className="card-atmosphere-gold rounded-lg p-5 mb-8 flex items-start gap-4">
           <span className="text-2xl mt-1">🤖</span>
           <div>
             <h4 className="font-working-title text-gold-accent text-lg mb-1">AI Drafting in Progress</h4>
             <p className="text-sm text-text-secondary leading-relaxed">
               Your pitch deck <strong className="text-on-surface">{activeListing.details?.source_pdf}</strong> is currently being analyzed. The Council AI is extracting facts and structuring the dossier. This process usually takes 2-5 minutes. We will notify you when it&apos;s ready for your final review.
             </p>
           </div>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 ${activeListing.pipelineStatus === 'ai_drafting' ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Left Col: Workspace Intelligence */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="card-atmosphere rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Listing Health</h3>
            {activeListing.pipelineStatus === 'ai_drafting' ? (
               <div className="flex flex-col items-center justify-center py-4 opacity-50">
                 <span className="text-3xl mb-2 animate-pulse">⏳</span>
                 <p className="text-xs text-center font-label-caps uppercase tracking-widest text-text-muted">AWAITING AI ANALYSIS</p>
               </div>
            ) : (
               <div className="flex items-center gap-4 mb-6">
                 {(() => {
                   // Same source as the grid ring above and the "Missing:"
                   // checklist below — see that comment for why
                   // signals.completeness is never used here.
                   const healthScore = computeListingStrength(activeListing).score;
                   return (
                 <div className="relative w-16 h-16 shrink-0">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                     <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                     <path className="text-gold-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${healthScore}, 100`} strokeWidth="4"></path>
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="font-data-tabular font-bold text-sm text-text-primary">{healthScore}%</span>
                   </div>
                 </div>
                   );
                 })()}
                 <p className="text-xs text-text-secondary leading-relaxed">
                   A completeness score of 85%+ guarantees Priority Ranking in Broker feeds.
                 </p>
               </div>
            )}
            {/* Rule-based checklist of what's actually missing (same engine
                as the Broker's Listing Strength card, no AI) */}
            {activeListing.pipelineStatus !== 'ai_drafting' && (() => {
              const strength = computeListingStrength(activeListing);
              if (strength.missing.length === 0) {
                return <p className="text-xs text-success">All key fields are complete.</p>;
              }
              return (
                <ul className="flex flex-col gap-1.5 border-t border-surface-variant pt-4">
                  {strength.missing.map(item => (
                    <li key={item} className="text-xs text-text-secondary flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-accent/60 shrink-0"></span> Missing: {item}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>

          <div className="card-atmosphere rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Engagement Analytics</h3>
            {activeListing.pipelineStatus === 'ai_drafting' ? (
               <div className="flex flex-col items-center justify-center py-4 opacity-50">
                 <p className="text-xs text-center text-text-secondary">Metrics will activate once the property is published.</p>
               </div>
            ) : (
               <>
                 <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                     <span className="font-body-md text-text-primary">Profile Views</span>
                     <span className="font-data-tabular text-sm text-text-muted">Not yet tracked</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="font-body-md text-text-primary">Saved to Archives</span>
                     <span className="font-data-tabular text-sm text-text-muted">Not yet tracked</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="font-body-md text-text-primary">Total Inquiries</span>
                     <span className="font-data-tabular text-lg font-bold text-gold-accent">{incomingPitches.length}</span>
                   </div>
                 </div>
                 <p className="text-[10px] text-text-muted mt-4 text-center">View tracking arrives once page instrumentation ships — no invented numbers until then.</p>
               </>
            )}
          </div>

          {/* Property Timeline — inquiries, deal changes, notes, viewings on
              this property, straight from crm_activity_log */}
          <div className="card-atmosphere rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Property Timeline</h3>
            <DealTimeline propertyId={activeListing.id} mockUserId={currentUser?.id} />
          </div>
        </div>

        {/* Right Col: Active Inquiries (Pitches) */}
        <div className="md:col-span-8 flex flex-col">
          {/* Invite an advisor — owner-initiated handshake, spends 1 Connect */}
          <div className="card-atmosphere rounded-lg p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-working-title text-base text-on-surface">Invite an advisor</h3>
              <span className="font-label-caps text-[10px] tracking-widest text-gold-accent">◈ 1 CONNECT · {connects} LEFT</span>
            </div>
            <p className="text-xs text-text-secondary mb-3">You control who represents this property. Sending a handshake spends 1 Connect — whether or not they accept.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 hov-card border border-surface-variant rounded px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-gold-accent transition-colors"
                type="text"
                placeholder="Broker name or PRC #"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
              />
              <button
                type="button"
                className="bg-gold-accent text-background active:scale-95 font-label-caps uppercase tracking-widest font-bold px-5 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                disabled={!inviteName.trim() || connects < 1}
                onClick={async () => { const ok = await inviteBroker(activeListing.id, inviteName.trim()); if (ok) setInviteName(""); }}
              >
                Send Handshake
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="font-working-title text-xl text-on-surface flex items-center gap-2">
              Active Inquiries
            </h2>
            {incomingPitches.filter(p => p.status === 'pending').length > 0 && (
              <span className="bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] px-2 py-1 rounded-sm tracking-wider">
                {incomingPitches.filter(p => p.status === 'pending').length} PENDING
              </span>
            )}
          </div>

          {incomingPitches.length === 0 ? (
             <div className="bg-[#121110] border border-surface-variant rounded-lg p-12 text-center flex flex-col items-center">
               <span className="text-4xl mb-4 opacity-50">📡</span>
               <p className="font-working-title text-lg text-on-surface mb-2">No inquiries yet.</p>
               <p className="text-sm text-text-secondary max-w-sm">
                 Brokers are reviewing your dossier. Listings with extensive media galleries receive inquiries 4× faster.
               </p>
               {!activeListing?.hasMedia && (
                 <button className="mt-6 border border-gold-accent text-gold-accent font-label-caps uppercase tracking-widest px-6 py-2 rounded hover:bg-gold-accent/10 transition-colors" onClick={() => setShowWizard('edit')}>
                   Add Media Gallery
                 </button>
               )}
             </div>
          ) : (
            <div className="flex flex-col gap-4">
              {incomingPitches.map(pitch => (
                <div key={pitch.id} className="card-atmosphere rounded-lg p-6 shadow-xl relative">
                  {/* Status Indicator Line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${pitch.status === 'accepted' ? 'bg-success' : pitch.status === 'declined' ? 'bg-error' : 'bg-gold-accent'}`}></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-alt border border-surface-variant flex items-center justify-center font-bold text-lg text-on-surface">
                        {pitch.brokerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-working-title text-lg text-on-surface flex items-center gap-2">
                          {pitch.brokerName}
                          {/* An owner's incoming deals are either a broker's
                              pitch or a buyer's direct inquiry — "PRC
                              VERIFIED" (a broker-only credential) was
                              previously shown unconditionally on both. */}
                          {pitch.otherPartyRole === 'Broker' ? (
                            <span className="bg-gold-accent/10 text-gold-accent text-[10px] font-label-caps px-1.5 py-0.5 rounded tracking-widest">PRC VERIFIED</span>
                          ) : (
                            <span className="bg-surface-variant text-text-secondary text-[10px] font-label-caps px-1.5 py-0.5 rounded tracking-widest">PROSPECTIVE BUYER</span>
                          )}
                        </h4>
                        <span className="text-xs text-text-secondary">{pitch.otherPartyRole === 'Broker' ? pitch.brokerFirm : 'Direct inquiry'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-caps text-[10px] tracking-widest text-text-muted uppercase block">{pitch.timeRemaining}</span>
                      {pitch.status === 'pending' && <span className="text-[10px] text-gold-accent">AWAITING RESPONSE</span>}
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0a0a] p-4 rounded border border-surface-alt relative mb-4">
                    <p className="font-body-md text-sm text-text-secondary italic leading-relaxed">
                      {pitch.message}
                    </p>
                  </div>

                  {/* Private scratchpad -- only you see this, shared with your
                      own view of this deal across sessions (deals.private_notes) */}
                  <div className="mb-4">
                    <span className="block font-label-caps text-[10px] tracking-widest text-text-muted uppercase mb-1">Private Notes</span>
                    <textarea
                      className="w-full bg-[#0a0a0a] border border-surface-alt rounded p-3 text-xs text-text-secondary focus:outline-none focus:border-gold-accent/50 transition-colors resize-y min-h-[60px]"
                      placeholder="Jot down anything about this inquiry — only visible to you..."
                      value={dealNotes[pitch.id] !== undefined ? dealNotes[pitch.id] : (pitch.privateNotes || "")}
                      onChange={(e) => handleSaveDealNote(pitch.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {pitch.status === 'pending' && (
                    <div className="flex gap-3">
                      <button 
                        className="flex-1 hov-card border border-surface-variant hover:border-error hover:text-error text-text-primary font-working-title text-sm font-bold py-3 rounded transition-colors" 
                        onClick={() => updatePitchStatus(pitch.id, 'declined')}
                      >
                        Decline
                      </button>
                      <button 
                        className="flex-1 bg-gold-accent text-background active:scale-95 font-working-title text-sm font-bold py-3 rounded hover:opacity-90 transition-opacity shadow-lg" 
                        onClick={() => updatePitchStatus(pitch.id, 'accepted')}
                      >
                        Accept Inquiry
                      </button>
                    </div>
                  )}
      
                  {pitch.status === 'accepted' && pitch.brokerContact && (
                    <div className="mt-2 p-4 bg-success/5 border border-success/20 rounded">
                      <div className="font-label-caps text-[10px] tracking-widest text-success uppercase mb-3">Intelligence Unlocked</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-text-secondary mb-1">Direct Phone</span>
                          <span className="font-working-title text-on-surface text-sm">{pitch.brokerContact.phone}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-text-secondary mb-1">Direct Email</span>
                          <span className="font-working-title text-on-surface text-sm">{pitch.brokerContact.email}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {pitch.status === 'declined' && (
                    <div className="mt-2 p-3 bg-surface-alt border border-surface-variant rounded text-center">
                      <span className="text-xs text-text-secondary font-working-title uppercase tracking-wider">Inquiry Declined</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

