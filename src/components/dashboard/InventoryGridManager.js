"use client";

import { useState, useRef } from "react";
import { Upload, Trash2, X, Plus } from "lucide-react";
import PhotoUploader from "./PhotoUploader";
import { uploadPropertyPhoto } from "../../lib/storage";

export default function InventoryGridManager({ units = [], onChange, isPro, onAutoSave }) {
  const [activePhotoUnit, setActivePhotoUnit] = useState(null);
  const [uploadingUnitId, setUploadingUnitId] = useState(null);

  const addUnit = () => {
    const newUnit = { id: Date.now().toString(), name: "", size: "", features: [], photos: [] };
    const newUnits = [...units, newUnit];
    onChange(newUnits);
    onAutoSave(newUnits);
  };

  const removeUnit = (id) => {
    if (window.confirm("Delete this unit?")) {
      const newUnits = units.filter(u => u.id !== id);
      onChange(newUnits);
      onAutoSave(newUnits);
    }
  };

  const updateUnit = (id, field, value, shouldSave = false) => {
    const newUnits = units.map(u => u.id === id ? { ...u, [field]: value } : u);
    onChange(newUnits);
    if (shouldSave) onAutoSave(newUnits);
  };

  const handleFeatureAdd = (id, e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      e.preventDefault();
      const val = e.target.value.trim();
      const unit = units.find(u => u.id === id);
      if (unit && !unit.features?.includes(val)) {
        const newFeatures = [...(unit.features || []), val];
        const newUnits = units.map(u => u.id === id ? { ...u, features: newFeatures } : u);
        onChange(newUnits);
        onAutoSave(newUnits);
        e.target.value = '';
      }
    }
  };

  const removeFeature = (id, feature) => {
    const unit = units.find(u => u.id === id);
    if (unit) {
      const newFeatures = unit.features.filter(f => f !== feature);
      const newUnits = units.map(u => u.id === id ? { ...u, features: newFeatures } : u);
      onChange(newUnits);
      onAutoSave(newUnits);
    }
  };

  const handleDirectDrop = async (e, id) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadingUnitId(id);
      try {
        const url = await uploadPropertyPhoto(file);
        const unit = units.find(u => u.id === id);
        const newPhotos = [...(unit.photos || []), url];
        updateUnit(id, "photos", newPhotos, true);
      } catch (err) {
        console.error("Direct upload failed:", err);
      }
      setUploadingUnitId(null);
    }
  };

  const maxPhotos = isPro ? 5 : 1;

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="bg-[#121110] rounded-lg border border-surface-variant overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-alt border-b border-surface-variant">
              <th className="p-4 font-label-caps text-[10px] tracking-widest text-gold-accent uppercase w-[25%]">Unit Identifier</th>
              <th className="p-4 font-label-caps text-[10px] tracking-widest text-gold-accent uppercase w-[20%]">Size (sqm)</th>
              <th className="p-4 font-label-caps text-[10px] tracking-widest text-gold-accent uppercase w-[40%]">Tags & Features</th>
              <th className="p-4 font-label-caps text-[10px] tracking-widest text-gold-accent uppercase text-center w-[10%]">Media</th>
              <th className="p-4 font-label-caps text-[10px] tracking-widest text-gold-accent uppercase text-center w-[5%]"></th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-text-secondary text-sm italic border-b border-surface-variant">
                  No units added yet. Click below to add your first unit.
                </td>
              </tr>
            ) : (
              units.map(unit => (
                <tr key={unit.id} className="border-b border-surface-variant hover:bg-surface-variant/30 transition-colors group">
                  <td className="p-3 align-top border-r border-surface-variant/30">
                    <input 
                      type="text" 
                      value={unit.name || ""} 
                      onChange={(e) => updateUnit(unit.id, "name", e.target.value)} 
                      onBlur={(e) => updateUnit(unit.id, "name", e.target.value, true)}
                      placeholder="e.g. Master Suite" 
                      className="w-full bg-transparent border border-transparent hover:border-surface-variant focus:border-gold-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none transition-colors"
                    />
                  </td>
                  <td className="p-3 align-top">
                    <input 
                      type="text" 
                      value={unit.size || ""} 
                      onChange={(e) => updateUnit(unit.id, "size", e.target.value)} 
                      onBlur={(e) => updateUnit(unit.id, "size", e.target.value, true)}
                      placeholder="e.g. 30" 
                      className="w-full bg-transparent border border-transparent hover:border-surface-variant focus:border-gold-accent rounded px-2 py-1 text-sm text-text-primary focus:outline-none transition-colors"
                    />
                  </td>
                  <td className="p-3 align-top">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(unit.features || []).map((feature, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-surface-variant border border-gold-accent/20 text-[11px] text-text-primary rounded uppercase tracking-wide font-working-title">
                          {feature}
                          <button onClick={() => removeFeature(unit.id, feature)} className="text-text-muted hover:text-error transition-colors">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        onKeyDown={(e) => handleFeatureAdd(unit.id, e)} 
                        placeholder="Type a feature & press Enter..." 
                        className="bg-transparent text-sm text-text-secondary focus:outline-none placeholder-text-muted/50 border-b border-surface-variant focus:border-gold-accent transition-colors flex-1"
                      />
                      <button 
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling;
                          if (input && input.value.trim() !== '') {
                            handleFeatureAdd(unit.id, { key: 'Enter', preventDefault: () => {}, target: input });
                          }
                        }}
                        className="text-text-muted hover:text-gold-accent transition-colors"
                        title="Add feature"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </td>
                  <td 
                    className={`p-3 align-top text-center transition-colors ${uploadingUnitId === unit.id ? 'opacity-50' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDirectDrop(e, unit.id)}
                  >
                    <button 
                      onClick={() => setActivePhotoUnit(unit.id)}
                      className={`h-10 w-10 flex items-center justify-center rounded border ${unit.photos?.some(p => p) ? 'bg-gold-accent/20 border-gold-accent text-gold-accent' : 'bg-surface-alt border-surface-variant text-text-muted hover:border-gold-accent hover:text-gold-accent'} transition-colors mx-auto`}
                      title="Upload photos"
                    >
                      <Upload size={18} />
                    </button>
                    {unit.photos?.filter(p => p).length > 0 && (
                      <div className="text-[10px] text-text-secondary mt-1">
                        {unit.photos.filter(p => p).length} photos
                      </div>
                    )}
                    {uploadingUnitId === unit.id && (
                      <div className="text-[10px] text-gold-accent mt-1 animate-pulse">
                        Uploading...
                      </div>
                    )}
                  </td>
                  <td className="p-3 align-top text-center">
                    <button 
                      onClick={() => removeUnit(unit.id)}
                      className="inline-flex items-center justify-center p-2 rounded hover:bg-error/10 text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button 
        onClick={addUnit}
        className="self-start border border-gold-accent text-gold-accent hover:bg-gold-accent/10 px-4 py-2 flex items-center gap-2 rounded text-sm font-working-title transition-colors"
      >
        <Plus size={16} /> Add Unit
      </button>

      {/* Photo Uploader Modal */}
      {activePhotoUnit && (
        <div 
          className="fixed inset-0 z-[3000] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]"
          onDragOver={e => e.preventDefault()}
          onDrop={e => e.preventDefault()}
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
              const u = units.find(unit => unit.id === activePhotoUnit);
              if (!u) return null;
              
              // Ensure we have an array for photos
              const photosArray = u.photos || (u.image ? [u.image] : Array(maxPhotos).fill(""));
              while (photosArray.length < maxPhotos) photosArray.push("");
              if (photosArray.length > maxPhotos) photosArray.length = maxPhotos;

              const handlePhotoChange = (newPhotos) => {
                const newUnits = units.map(un => un.id === activePhotoUnit ? { ...un, photos: newPhotos, image: newPhotos[0] } : un);
                onChange(newUnits);
                onAutoSave(newUnits);
              };

              return (
                <div>
                  <div className="mb-4">
                    <PhotoUploader 
                      photos={photosArray} 
                      onChange={handlePhotoChange}
                      isPro={isPro}
                      maxFreePhotos={isPro ? 5 : 1}
                    />
                  </div>
                  {!isPro && (
                    <div className="mt-4 p-4 border border-gold-accent/20 bg-gold-accent/5 rounded-lg text-sm text-text-secondary">
                      <span className="text-gold-accent font-bold uppercase tracking-wide text-xs mb-1 block">Free Tier Limit</span>
                      Upgrade to unlock up to 5 photos per unit.
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
