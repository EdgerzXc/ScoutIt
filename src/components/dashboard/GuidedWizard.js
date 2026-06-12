"use client";

import { useState } from "react";
import styles from "./OwnerMode.module.css";

const TOTAL_STEPS = 8;

export default function GuidedWizard({ onPublish, onClose }) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    transaction: "",
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
    onPublish(computeScore());
  };

  if (isAdvanced) {
    return (
      <div className={styles.wizardOverlay}>
        <div className={styles.wizardHeader}>
          <button className={styles.btnText} onClick={onClose}>← Cancel</button>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)'}}>ADVANCED MODE</span>
          <button className={styles.btnText} onClick={() => setIsAdvanced(false)}>Switch to Wizard</button>
        </div>
        
        <div className={styles.advancedForm}>
          <h2 style={{fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 32}}>Full Listing Configuration</h2>
          
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Asset Type</label>
              <select className={styles.wInput} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="">Select type...</option>
                <option value="house">House</option>
                <option value="lot">Lot</option>
                <option value="condo">Condo</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Location / Address</label>
              <input className={styles.wInput} type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. BGC Core" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Pricing (Internal)</label>
              <input className={styles.wInput} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="₱" />
              <span style={{fontSize: 12, color: 'var(--text-muted)'}}>Never displayed publicly.</span>
            </div>
            <div className={styles.formGroup}>
              <label>Verification Status</label>
              <select className={styles.wInput} value={formData.verified} onChange={e => setFormData({...formData, verified: e.target.value === 'true'})}>
                <option value="false">Unverified</option>
                <option value="true">Owner Verified (Docs uploaded)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Editorial Description</label>
            <textarea className={styles.wTextarea} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the space..."></textarea>
          </div>

          <div className={styles.formGroup}>
            <label>Media Link (Google Drive / Dropbox)</label>
            <div className={styles.driveWarning}>
              ⚠️ Ensure folder permissions are set to "Anyone with the link can view".
            </div>
            <input 
              className={styles.wInput} 
              type="url" 
              value={formData.mediaLink} 
              onChange={e => setFormData({...formData, mediaLink: e.target.value})} 
              placeholder="https://drive.google.com/drive/folders/..." 
            />
          </div>

          <button className={styles.buttonPrimary} onClick={handlePublish} style={{marginTop: 32}}>Publish Configuration</button>
        </div>
      </div>
    );
  }

  // GUIDED WIZARD
  return (
    <div className={styles.wizardOverlay}>
      <div className={styles.wizardHeader}>
        <button className={styles.btnText} onClick={step === 1 ? onClose : prevStep}>
          {step === 1 ? "← Exit" : "← Back"}
        </button>
        
        <div className={styles.wizardDots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`${styles.wDot} ${step >= i + 1 ? styles.active : ''}`} />
          ))}
        </div>

        <button className={styles.btnText} onClick={() => setIsAdvanced(true)}>
          Advanced Mode
        </button>
      </div>

      <div className={styles.wizardContent}>
        {step === 1 && (
          <>
            <h2>How are you listing this property?</h2>
            <div className={styles.typeGrid}>
              {[
                { id: 'sale', icon: '💰', label: 'For Sale' },
                { id: 'rent', icon: '🔑', label: 'For Rent' },
                { id: 'lease', icon: '📄', label: 'Long-term Lease' },
              ].map(t => (
                <div 
                  key={t.id} 
                  className={`${styles.typeCard} ${formData.transaction === t.id ? styles.selected : ''}`}
                  onClick={() => setFormData({...formData, transaction: t.id})}
                >
                  <div className={styles.typeIcon}>{t.icon}</div>
                  <div>{t.label}</div>
                </div>
              ))}
            </div>
            <button className={styles.buttonPrimary} style={{marginTop: 48}} disabled={!formData.transaction} onClick={nextStep}>Continue →</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>What are you listing?</h2>
            <div className={styles.typeGrid}>
              {[
                { id: 'house', icon: '🏠', label: 'House' },
                { id: 'lot', icon: '🌳', label: 'Lot / Land' },
                { id: 'condo', icon: '🏢', label: 'Condo / Apt' },
                { id: 'commercial', icon: '🏬', label: 'Commercial' },
              ].map(t => (
                <div 
                  key={t.id} 
                  className={`${styles.typeCard} ${formData.type === t.id ? styles.selected : ''}`}
                  onClick={() => setFormData({...formData, type: t.id})}
                >
                  <div className={styles.typeIcon}>{t.icon}</div>
                  <div>{t.label}</div>
                </div>
              ))}
            </div>
            <button className={styles.buttonPrimary} style={{marginTop: 48}} disabled={!formData.type} onClick={nextStep}>Continue →</button>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Where is it?</h2>
            <input 
              className={styles.wInput} 
              type="text" 
              placeholder="e.g. Dasmariñas Village, Makati" 
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              autoFocus
            />
            <button className={styles.buttonPrimary} disabled={!formData.location} onClick={nextStep}>Continue →</button>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Price expectations?</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: 32}}>This is stored internally and NEVER displayed publicly.</p>
            <input 
              className={styles.wInput} 
              type="number" 
              placeholder="₱ (Amount)" 
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              autoFocus
            />
            <div style={{display: 'flex', gap: 16, width: '100%'}}>
              <button className={styles.buttonPrimary} disabled={!formData.price} onClick={nextStep}>Continue →</button>
              <button className={styles.buttonSecondary} onClick={nextStep}>Skip</button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2>Add media link</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: 16}}>Paste a Google Drive or Dropbox link to your photos/videos.</p>
            
            <div className={styles.driveWarning}>
              ⚠️ Important: Make sure your folder is set to 'Anyone with the link can view' so brokers can actually see it.
            </div>

            <input 
              className={styles.wInput} 
              type="url" 
              placeholder="https://drive.google.com/..." 
              value={formData.mediaLink}
              onChange={e => setFormData({...formData, mediaLink: e.target.value})}
              autoFocus
            />

            <div style={{display: 'flex', gap: 16, width: '100%'}}>
              <button className={styles.buttonPrimary} disabled={!formData.mediaLink} onClick={nextStep}>Continue →</button>
              <button className={styles.buttonSecondary} onClick={nextStep}>
                Skip for now
              </button>
            </div>
            <p style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center'}}>
              Without media, brokers cannot pitch you.
            </p>
          </>
        )}

        {step === 6 && (
          <>
            <h2>Describe it</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: 32}}>How many rooms? What's nearby? What's the vibe?</p>
            <textarea 
              className={styles.wTextarea} 
              placeholder="Start typing..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              autoFocus
            />
            <div style={{display: 'flex', gap: 16, width: '100%'}}>
              <button className={styles.buttonPrimary} disabled={formData.description.length < 10} onClick={nextStep}>Continue →</button>
              <button className={styles.buttonSecondary} onClick={nextStep}>Skip</button>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <h2>Verify ownership?</h2>
            <div className={styles.typeCard} style={{width: '100%', marginBottom: 32, padding: 64}} onClick={() => setFormData({...formData, verified: !formData.verified})}>
              <div className={styles.typeIcon}>{formData.verified ? "✅" : "📑"}</div>
              <div style={{color: formData.verified ? 'var(--accent)' : 'var(--text-primary)'}}>
                {formData.verified ? "Docs Attached" : "Tap to simulate title upload"}
              </div>
            </div>
            <div style={{display: 'flex', gap: 16, width: '100%'}}>
              <button className={styles.buttonPrimary} disabled={!formData.verified} onClick={nextStep}>Continue →</button>
              <button className={styles.buttonSecondary} onClick={nextStep}>
                Skip (List as Unverified)
              </button>
            </div>
          </>
        )}

        {step === 8 && (
          <>
            <h2>Ready to publish</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: 32}}>Your listing completeness score will be {computeScore()}/100.</p>
            
            <button className={styles.buttonPrimary} onClick={handlePublish}>Publish to Ledger</button>
          </>
        )}
      </div>
    </div>
  );
}
