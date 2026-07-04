"use client";

import { useState } from "react";
import { X, Building2, UserCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NewDealModal({ isOpen, onClose, onDealCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    otherPartyEmail: "",
    status: "connected",
    initialMessage: ""
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mockOwnerId: "master-dev"
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        if (onDealCreated) onDealCreated(data.deal);
        onClose();
      } else {
        alert(data.error || "Failed to create deal");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-surface border border-surface-variant rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-surface-variant bg-surface/50">
            <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center gap-2">
              Create New Deal
            </h2>
            <button onClick={onClose} className="text-text-muted hover:text-on-surface transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-label-caps text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 size={14} /> Property ID (Airtable/Supabase ID)
              </label>
              <input 
                required
                type="text" 
                placeholder="e.g. recXXXXX or uuid"
                className="w-full bg-surface-alt border border-surface-variant rounded px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors"
                value={formData.propertyId}
                onChange={e => setFormData({ ...formData, propertyId: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
                <UserCircle2 size={14} /> Other Party ID
              </label>
              <input 
                required
                type="text" 
                placeholder="User UUID of Buyer/Broker/Owner"
                className="w-full bg-surface-alt border border-surface-variant rounded px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors"
                value={formData.otherPartyEmail}
                onChange={e => setFormData({ ...formData, otherPartyEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps text-text-secondary uppercase tracking-wider mb-2">
                Initial Status
              </label>
              <select 
                className="w-full bg-surface-alt border border-surface-variant rounded px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors appearance-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="connected">Connected (New Inquiry)</option>
                <option value="pending">Pending (Reviewing/Pitched)</option>
                <option value="accepted">Accepted</option>
                <option value="closed">Closed Won</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-label-caps text-text-secondary uppercase tracking-wider mb-2">
                Initial Pitch / Message
              </label>
              <textarea 
                rows={3}
                placeholder="Optional starting message..."
                className="w-full bg-surface-alt border border-surface-variant rounded px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors resize-none"
                value={formData.initialMessage}
                onChange={e => setFormData({ ...formData, initialMessage: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2 rounded text-sm font-working-title text-text-secondary hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-gold-accent text-background font-bold font-working-title px-6 py-2 rounded shadow-[0_0_15px_rgba(247,198,78,0.4)] hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? "Creating..." : "Create Deal"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
