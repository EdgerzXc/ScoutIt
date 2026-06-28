import { useState } from 'react';
import PhotoUploader from './PhotoUploader';
import { Plus, Trash2 } from 'lucide-react';

export default function UnitBuilder({ units = [], onChange, isPro = false }) {
  const handleAddUnit = () => {
    onChange([...units, { name: "", size: "", price: "", photos: ["", "", "", "", ""] }]);
  };

  const handleRemoveUnit = (index) => {
    const newUnits = units.filter((_, i) => i !== index);
    onChange(newUnits);
  };

  const handleUpdateUnit = (index, field, value) => {
    const newUnits = [...units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    
    // Sync the primary photo convenience field if photos array changes
    if (field === "photos" && value.length > 0) {
      newUnits[index].photo = value.find(p => p.trim() !== "") || "";
    }
    
    onChange(newUnits);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end border-b border-surface-variant pb-2">
        <div>
          <h3 className="font-headline-editorial text-2xl text-gold-accent">Units & Spaces Inventory</h3>
          <p className="text-sm text-text-secondary">Define individual units, layouts, or floors available in this property.</p>
        </div>
        <button 
          onClick={handleAddUnit}
          className="flex items-center gap-2 px-4 py-2 bg-gold-accent text-background font-label-caps tracking-widest text-xs uppercase rounded hover:bg-gold-accent-bright transition-colors"
        >
          <Plus size={14} /> Add Unit
        </button>
      </div>

      {units.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-surface-variant rounded bg-surface-alt">
          <p className="text-text-secondary text-sm">No units added yet. Click "Add Unit" to start building your inventory.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {units.map((unit, index) => (
            <div key={index} className="flex flex-col gap-4 p-5 border border-surface-variant rounded bg-surface-alt relative group">
              <button 
                onClick={() => handleRemoveUnit(index)}
                className="absolute top-4 right-4 text-text-secondary hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                title="Remove Unit"
              >
                <Trash2 size={16} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Unit Name / Identifier</label>
                  <input 
                    className="bg-surface border border-surface-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-gold-accent" 
                    type="text" 
                    value={unit.name || ""} 
                    onChange={e => handleUpdateUnit(index, "name", e.target.value)} 
                    placeholder="e.g. Studio Unit A, Floor 12" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Size / Area (sqm)</label>
                  <input 
                    className="bg-surface border border-surface-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-gold-accent" 
                    type="number" 
                    value={unit.size || ""} 
                    onChange={e => handleUpdateUnit(index, "size", e.target.value)} 
                    placeholder="e.g. 45" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Price (₱)</label>
                  <input 
                    className="bg-surface border border-surface-variant rounded px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-gold-accent" 
                    type="number" 
                    value={unit.price || ""} 
                    onChange={e => handleUpdateUnit(index, "price", e.target.value)} 
                    placeholder="e.g. 5000000" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-label-caps tracking-widest text-text-secondary uppercase">Unit Photos & Blueprints</label>
                  {!isPro && (
                    <span className="text-[10px] uppercase tracking-widest font-mono text-gold-accent border border-gold-accent/30 px-1.5 py-0.5 rounded">
                      Free Tier: 1 Photo Limit
                    </span>
                  )}
                </div>
                
                {/* For Free users, slice the photos array to 1 so they only see one slot. For Pro, slice to 5. */}
                <div className={!isPro ? "max-w-xs" : ""}>
                  <PhotoUploader 
                    photos={(unit.photos || []).slice(0, isPro ? 5 : 1)} 
                    onChange={(newPhotos) => {
                      // Pad back to 5 if needed, though PhotoUploader handles it.
                      handleUpdateUnit(index, "photos", newPhotos)
                    }}
                    isPro={isPro}
                    maxFreePhotos={1}
                  />
                </div>
                {!isPro && (
                  <p className="text-[10px] text-text-secondary">
                    You can only upload 1 photo per unit on the Free tier. Choose between a floor plan or an interior shot. <a href="/pricing/seeker" className="text-gold-accent hover:underline">Upgrade to Pro</a> to upload up to 5 photos per unit.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
