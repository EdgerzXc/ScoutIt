"use client";

import { useState } from "react";

const TOTAL_STEPS = 7;

export default function GuidedWizard({ onPublish, onClose }) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    type: "",
    location: "",
    price: "",
    mediaLink: "",
    description: "",
    verified: false
  });

  const nextStep = () => setStep(s => Math.min(TOTAL_STEPS, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  // Compute completeness score: basics(30) + photos(25) + desc(20) + verified(25)
  const computeScore = () => {
    let score = 0;
    if (formData.type && formData.location && formData.price) score += 30;
    if (formData.mediaLink.trim().length > 5) score += 25;
    if (formData.description.length > 20) score += 20;
    if (formData.verified) score += 25;
    return score;
  };

  const handlePublish = () => {
    onPublish({ ...formData, completenessScore: computeScore() });
  };

  if (isAdvanced) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[fadeIn_0.3s_ease-out] overflow-y-auto">
        <div className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-surface-variant p-4 flex justify-between items-center z-10">
          <button className="text-text-secondary hover:text-on-surface font-working-title text-sm" onClick={onClose}>← Cancel</button>
          <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase">Advanced Mode</span>
          <button className="text-gold-accent hover:text-gold-accent/80 font-working-title text-sm" onClick={() => setIsAdvanced(false)}>Switch to Wizard</button>
        </div>
        
        <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12">
          <h2 className="font-headline-editorial text-4xl mb-8 text-on-surface">Full Listing Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-on-surface">Asset Type</label>
              <select className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="">Select type...</option>
                <option value="house">House</option>
                <option value="lot">Lot</option>
                <option value="condo">Condo</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-on-surface">Location / Address</label>
              <input className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. BGC Core" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-on-surface">Pricing (Internal)</label>
              <input className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="₱" />
              <span className="text-xs text-text-secondary">Never displayed publicly.</span>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-on-surface">Verification Status</label>
              <select className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" value={formData.verified} onChange={e => setFormData({...formData, verified: e.target.value === 'true'})}>
                <option value="false">Unverified</option>
                <option value="true">Owner Verified (Docs uploaded)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <label className="text-sm font-bold text-on-surface">Editorial Description</label>
            <textarea className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface min-h-[120px] focus:outline-none focus:border-gold-accent transition-colors" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the space..."></textarea>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <label className="text-sm font-bold text-on-surface">Media Link (Google Drive / Dropbox)</label>
            <div className="bg-gold-accent/10 border border-gold-accent/30 text-gold-accent p-3 rounded text-sm mb-2">
              ⚠️ Ensure folder permissions are set to "Anyone with the link can view".
            </div>
            <input 
              className="bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
              type="url" 
              value={formData.mediaLink} 
              onChange={e => setFormData({...formData, mediaLink: e.target.value})} 
              placeholder="https://drive.google.com/drive/folders/..." 
            />
          </div>

          <button className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50" onClick={handlePublish}>Publish Configuration</button>
        </div>
      </div>
    );
  }

  // GUIDED WIZARD
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[fadeIn_0.3s_ease-out]">
      <div className="sticky top-0 bg-background p-4 flex justify-between items-center">
        <button className="text-text-secondary hover:text-on-surface font-working-title text-sm" onClick={step === 1 ? onClose : prevStep}>
          {step === 1 ? "← Exit" : "← Back"}
        </button>
        
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step >= i + 1 ? 'w-6 bg-gold-accent' : 'w-2 bg-surface-variant'}`} />
          ))}
        </div>

        <button className="text-gold-accent hover:text-gold-accent/80 font-working-title text-sm" onClick={() => setIsAdvanced(true)}>
          Advanced Mode
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center max-w-2xl mx-auto w-full p-6 text-center">
        {step === 1 && (
          <div className="w-full animate-[fadeIn_0.4s_ease-out]">
            <h2 className="font-headline-editorial text-4xl mb-8 text-on-surface">What are you listing?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'house', icon: '🏠', label: 'House' },
                { id: 'lot', icon: '🌳', label: 'Lot / Land' },
                { id: 'condo', icon: '🏢', label: 'Condo / Apt' },
                { id: 'commercial', icon: '🏬', label: 'Commercial' },
                { id: 'other', icon: '🧩', label: 'Other' },
              ].map(t => (
                <div 
                  key={t.id} 
                  className={`p-6 border rounded cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${formData.type === t.id ? 'bg-surface-container-low border-gold-accent' : 'bg-surface border-surface-variant hover:border-text-secondary'}`}
                  onClick={() => setFormData({...formData, type: t.id})}
                >
                  <div className="text-4xl">{t.icon}</div>
                  <div className="font-working-title">{t.label}</div>
                </div>
              ))}
            </div>
            <button className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50 mt-10" disabled={!formData.type} onClick={nextStep}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full animate-[fadeIn_0.4s_ease-out]">
            <h2 className="font-headline-editorial text-4xl mb-2 text-on-surface">Where is it?</h2>
            <p className="text-text-secondary mb-8">Pinpoint the location for spatial intelligence mapping.</p>
            <input 
              className="w-full bg-surface border border-surface-variant rounded px-4 py-4 text-lg text-center text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
              type="text" 
              placeholder="e.g. Dasmariñas Village, Makati" 
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              autoFocus
            />
            <button className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50 mt-6" disabled={!formData.location} onClick={nextStep}>Continue →</button>
          </div>
        )}

        {step === 3 && (
          <div className="w-full animate-[fadeIn_0.4s_ease-out]">
            <h2 className="font-headline-editorial text-4xl mb-2 text-on-surface">Price expectations?</h2>
            <p className="text-text-secondary mb-8">This is stored internally and NEVER displayed publicly.</p>
            <input 
              className="w-full bg-surface border border-surface-variant rounded px-4 py-4 text-2xl text-center text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
              type="number" 
              placeholder="₱ (Amount)" 
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              autoFocus
            />
            <div className="flex gap-4 mt-6">
              <button className="flex-1 bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50" disabled={!formData.price} onClick={nextStep}>Continue →</button>
              <button className="flex-1 bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-4 px-6 rounded hover:bg-surface-container transition-colors" onClick={nextStep}>Skip</button>
            </div>
            <p className="text-xs text-text-muted mt-4">Skipping is fine — but it lowers your completeness score, and brokers prioritize complete listings.</p>
          </div>
        )}

        {step === 4 && (
          <div className="w-full animate-[fadeIn_0.4s_ease-out]">
            <h2 className="font-headline-editorial text-4xl mb-2 text-on-surface">Add media link</h2>
            <p className="text-text-secondary mb-6">Paste a Google Drive or Dropbox link to your photos/videos.</p>
            
            <div className="bg-surface-alt border border-surface-variant p-4 rounded text-sm text-left mb-6">
              ⚠️ <strong>Important:</strong> Make sure your folder is set to 'Anyone with the link can view' so brokers can actually see it.
            </div>

            <input 
              className="w-full bg-surface border border-surface-variant rounded px-4 py-4 text-center text-on-surface focus:outline-none focus:border-gold-accent transition-colors" 
              type="url" 
              placeholder="https://drive.google.com/..." 
              value={formData.mediaLink}
              onChange={e => setFormData({...formData, mediaLink: e.target.value})}
              autoFocus
            />

            <div className="flex gap-4 mt-6">
              <button className="flex-1 bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50" disabled={!formData.mediaLink} onClick={nextStep}>Continue →</button>
              <button className="flex-1 bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-4 px-6 rounded hover:bg-surface-container transition-colors" onClick={nextStep}>Skip for now</button>
            </div>
            <p className="text-xs text-text-muted mt-4">Without media, your listing shows as a Market Signal only.</p>
          </div>
        )}

        {step === 5 && (
          <div className="w-full animate-[fadeIn_0.4s_ease-out]">
            <h2 className="font-headline-editorial text-4xl mb-2 text-on-surface">Describe it</h2>
            <p className="text-text-secondary mb-6">How many rooms? What's nearby? What's the vibe?</p>
            <textarea 
              className="w-full bg-surface border border-surface-variant rounded px-4 py-4 text-on-surface min-h-[160px] focus:outline-none focus:border-gold-accent transition-colors resize-none" 
              placeholder="Start typing..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              autoFocus
            />
            <div className="flex gap-4 mt-6">
              <button className="flex-1 bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50" disabled={formData.description.length < 10} onClick={nextStep}>Continue →</button>
              <button className="flex-1 bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-4 px-6 rounded hover:bg-surface-container transition-colors" onClick={nextStep}>Skip</button>
            </div>
            <p className="text-xs text-text-muted mt-4">Without a description, your listing ranks lower in broker feeds.</p>
          </div>
        )}

        {step === 6 && (
          <div className="w-full animate-[fadeIn_0.4s_ease-out]">
            <h2 className="font-headline-editorial text-4xl mb-8 text-on-surface">Verify ownership?</h2>
            <div 
              className={`p-12 border rounded cursor-pointer transition-all flex flex-col items-center justify-center gap-4 mb-8 ${formData.verified ? 'bg-surface-container-low border-gold-accent' : 'bg-surface border-surface-variant'}`} 
              onClick={() => setFormData({...formData, verified: !formData.verified})}
            >
              <div className="text-5xl">{formData.verified ? "✅" : "📑"}</div>
              <div className={`font-working-title text-lg ${formData.verified ? 'text-gold-accent' : 'text-on-surface'}`}>
                {formData.verified ? "Documents attached" : "Tap to attach your title or tax declaration"}
              </div>
              {!formData.verified && (
                <p className="text-sm text-text-secondary">A clear photo is fine. Verified listings earn a ✔ badge and rank higher.</p>
              )}
            </div>
            <div className="flex gap-4">
              <button className="flex-1 bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all disabled:opacity-50" disabled={!formData.verified} onClick={nextStep}>Continue →</button>
              <button className="flex-1 bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-4 px-6 rounded hover:bg-surface-container transition-colors" onClick={nextStep}>List as Unverified</button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="w-full animate-[fadeIn_0.4s_ease-out]">
            <h2 className="font-headline-editorial text-4xl mb-4 text-on-surface">Ready to publish</h2>
            
            <div className="bg-surface-alt border border-surface-variant p-8 rounded-lg mb-8">
              <div className="text-6xl text-gold-accent mb-4 font-display-md">{computeScore()}</div>
              <div className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-2">Completeness Score</div>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                Listings above 80% completeness rank higher in broker feeds.
              </p>
            </div>
            
            <button className="w-full bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all" onClick={handlePublish}>Publish to Ledger</button>
          </div>
        )}
      </div>
    </div>
  );
}
