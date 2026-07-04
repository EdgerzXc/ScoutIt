"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, UserCircle2, Calendar, FileText, CheckCircle2, MapPin, Clock } from "lucide-react";

export default function DealFileSlideOver({ isOpen, onClose, deal, onDealUpdate }) {
  const [notes, setNotes] = useState("");
  const [savingState, setSavingState] = useState("idle"); // idle, saving, saved
  const saveTimeout = useRef(null);

  useEffect(() => {
    if (deal) {
      // We assume notes are loaded via the main deal fetch or separately.
      // For now, if private_notes is missing, we leave it empty.
      setNotes(deal.private_notes || "");
    }
  }, [deal]);

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    setSavingState("saving");

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/deals/${deal.id}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: newNotes, mockOwnerId: "master-dev" }) // Remove mockOwnerId in prod
        });
        if (res.ok) {
          setSavingState("saved");
          setTimeout(() => setSavingState("idle"), 2000);
          if (onDealUpdate) onDealUpdate(deal.id, { private_notes: newNotes });
        } else {
          setSavingState("idle");
        }
      } catch (e) {
        console.error(e);
        setSavingState("idle");
      }
    }, 1000);
  };

  const getStatusColor = (status) => {
    if (status === "accepted" || status === "closed") return "bg-success text-background";
    if (status === "declined") return "bg-error text-background";
    if (status === "connected" || status === "pending") return "bg-gold-accent text-background";
    return "bg-surface-alt text-on-surface";
  };

  return (
    <AnimatePresence>
      {isOpen && deal && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-surface border-l border-surface-variant z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-surface-variant">
              <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center gap-2">
                Opportunity File
              </h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-alt text-text-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              {/* Status Pill */}
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest font-label-caps text-text-secondary">Stage</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(deal.status)}`}>
                  {deal.status}
                </span>
              </div>

              {/* Property Summary */}
              <div className="bg-surface-alt border border-surface-variant rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center shrink-0">
                    <Building2 className="text-gold-accent" size={24} />
                  </div>
                  <div>
                    <h3 className="font-working-title text-lg text-on-surface mb-1">{deal.propertyTitle}</h3>
                    <p className="text-sm text-text-secondary flex items-center gap-1">
                      <MapPin size={14} /> View listing details
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-gradient-to-br from-[#1a1917] to-[#111110] border border-surface-variant rounded-lg p-5 relative overflow-hidden group hover:border-gold-accent/30 transition-colors">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-surface-variant">
                    <UserCircle2 className="text-text-muted" size={24} />
                  </div>
                  <div>
                    <h3 className="font-working-title text-base text-on-surface">
                      {deal.status === "accepted" || deal.status === "closed" ? deal.otherParty : "🔒 Hidden"}
                    </h3>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-label-caps mt-1">
                      {deal.myRole === "buyer" ? (deal.broker_id ? "Broker" : "Owner") : deal.myRole === "broker" ? "Owner" : (deal.broker_id ? "Broker" : "Buyer")}
                    </p>
                  </div>
                </div>
                {deal.status !== "accepted" && deal.status !== "closed" && (
                  <div className="mt-4 pt-4 border-t border-surface-variant/50 text-xs text-text-muted flex items-center gap-2">
                    <Calendar size={14} /> Contact info unlocks when deal is accepted.
                  </div>
                )}
              </div>

              {/* Private Notes */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <h3 className="font-working-title text-sm text-on-surface flex items-center gap-2">
                    <FileText size={16} className="text-gold-accent" /> Private Notes
                  </h3>
                  {savingState === "saving" && <span className="text-[10px] uppercase text-text-muted animate-pulse">Saving...</span>}
                  {savingState === "saved" && <span className="text-[10px] uppercase text-success flex items-center gap-1"><CheckCircle2 size={12}/> Saved</span>}
                </div>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Jot down notes about this deal. Only you can see this."
                  className="w-full h-40 bg-surface-alt border border-surface-variant rounded-lg p-4 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors resize-none placeholder:text-text-muted"
                />
              </div>

              {/* Activity */}
              <div>
                <h3 className="font-working-title text-sm text-on-surface flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-gold-accent" /> Activity Timeline
                </h3>
                <div className="border-l border-surface-variant ml-2 pl-4 flex flex-col gap-4">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gold-accent border-2 border-surface"></div>
                    <p className="text-xs text-text-secondary mb-1">
                      {new Date(deal.lastActivityAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-on-surface">Deal activity recorded.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-surface-variant border-2 border-surface"></div>
                    <p className="text-xs text-text-secondary mb-1">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-on-surface">Deal initiated.</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
