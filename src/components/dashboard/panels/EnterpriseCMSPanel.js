"use client";

import { useState } from "react";
import GlassPanel from "../../ui/GlassPanel";

const MOCK_ESTATES = [
  { id: "e1", name: "Acqua Private Residences", location: "Mandaluyong City", status: "Active" },
  { id: "e2", name: "Century City", location: "Makati City", status: "Active" },
  { id: "e3", name: "Azure North", location: "San Fernando, Pampanga", status: "Pre-Selling" }
];

const MASTER_AMENITIES = [
  "Olympic Sized Pool", "Helipad", "Grand Lobby", "Fitness Center", "Co-working Space",
  "Movie Theater", "Children's Play Area", "Sky Lounge", "24/7 Concierge", "Retail Podium"
];

export default function EnterpriseCMSPanel() {
  const [activeEstate, setActiveEstate] = useState(MOCK_ESTATES[0].id);
  const [selectedAmenities, setSelectedAmenities] = useState(["Olympic Sized Pool", "Fitness Center", "Grand Lobby"]);

  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up-fade pb-12">
      {/* Header & Estate Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-white mb-1">Estate Content Manager</h2>
          <p className="text-sm text-text-secondary max-w-xl">
            Manage the global identity, master amenities, and overarching media for your development projects.
          </p>
        </div>
        <div className="w-full md:w-64">
          <label className="block text-[10px] tracking-widest text-gold-accent uppercase mb-2">Select Active Estate</label>
          <select 
            value={activeEstate}
            onChange={(e) => setActiveEstate(e.target.value)}
            className="w-full bg-surface-alt border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-gold-accent transition-colors"
          >
            {MOCK_ESTATES.map(est => (
              <option key={est.id} value={est.id}>{est.name} ({est.status})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Identity & Geo */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <GlassPanel className="p-6">
            <h3 className="text-lg font-medium text-white mb-6 border-b border-white/10 pb-4">Estate Identity & Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Official Project Name</label>
                <input type="text" defaultValue={MOCK_ESTATES.find(e=>e.id===activeEstate)?.name} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-gold-accent" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Marketing Description</label>
                <textarea rows={4} defaultValue="Experience tropical rainforest living right in the heart of the metropolis..." className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-gold-accent resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Coordinates (Latitude)</label>
                  <input type="text" defaultValue="14.5683" className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-gold-accent font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Coordinates (Longitude)</label>
                  <input type="text" defaultValue="121.0374" className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-gold-accent font-mono text-sm" />
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Infrastructure Map */}
          <GlassPanel className="p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h3 className="text-lg font-medium text-white">Vicinity & Infrastructure</h3>
              <button className="text-xs bg-gold-accent/10 text-gold-accent px-3 py-1.5 rounded-md hover:bg-gold-accent/20 transition-colors">
                + Add Point of Interest
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚇</span>
                  <div>
                    <div className="text-sm text-white">Future Subway Station (Makati Line)</div>
                    <div className="text-xs text-text-muted">Transport • 200m walking distance</div>
                  </div>
                </div>
                <button className="text-text-secondary hover:text-white">Edit</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛍️</span>
                  <div>
                    <div className="text-sm text-white">Power Plant Mall</div>
                    <div className="text-xs text-text-muted">Retail • Across the bridge</div>
                  </div>
                </div>
                <button className="text-text-secondary hover:text-white">Edit</button>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Col: Amenities & Media */}
        <div className="flex flex-col gap-6">
          <GlassPanel className="p-6">
            <h3 className="text-lg font-medium text-white mb-6 border-b border-white/10 pb-4">Master Amenities</h3>
            <p className="text-xs text-text-secondary mb-4">Checked amenities will automatically apply to all individual units under this estate.</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {MASTER_AMENITIES.map((amenity) => (
                <label key={amenity} className="flex items-center gap-3 cursor-pointer group" onClick={() => handleAmenityToggle(amenity)}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    selectedAmenities.includes(amenity) ? 'bg-gold-accent border-gold-accent text-black' : 'border-white/20 group-hover:border-white/40'
                  }`}>
                    {selectedAmenities.includes(amenity) && <span className="text-sm">✓</span>}
                  </div>
                  <span className={`text-sm ${selectedAmenities.includes(amenity) ? 'text-white' : 'text-text-secondary'}`}>
                    {amenity}
                  </span>
                </label>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="text-lg font-medium text-white mb-6 border-b border-white/10 pb-4">Estate Media Vault</h3>
            <div className="aspect-video bg-black/50 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2 text-text-secondary cursor-pointer hover:border-gold-accent/50 hover:text-white transition-colors">
              <span className="text-2xl">📸</span>
              <span className="text-xs text-center px-4">Upload drone footage, exterior renders, or master floor plans</span>
            </div>
          </GlassPanel>
        </div>

      </div>
    </div>
  );
}
