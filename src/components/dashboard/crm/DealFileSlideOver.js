"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Building2, UserCircle2, Calendar, FileText, CheckCircle2, MapPin, Clock, Download, ShieldCheck } from "lucide-react";
import { crmFetch } from "../../../lib/crmClient";
import { getSession } from "../../../lib/authClient";
import { isDevelopmentMockAllowed } from "../../../lib/developmentMock";
import { leadToVCard, exportFilename } from "../../../lib/leadExport";
import DealTimeline from "./DealTimeline";

export default function DealFileSlideOver({ isOpen, onClose, deal, onDealUpdate, mockUserId }) {
  const reduceMotion = useReducedMotion();
  const [notes, setNotes] = useState("");
  const [savingState, setSavingState] = useState("idle"); // idle, saving, saved
  const [exportingTranscript, setExportingTranscript] = useState(false);
  const saveTimeout = useRef(null);

  const handleDownloadVCard = () => {
    const vcard = leadToVCard({
      ...deal,
      name: deal.name || deal.otherParty,
      email: deal.email || deal.otherPartyEmail,
      phone: deal.phone || deal.otherPartyPhone,
    });
    if (!vcard) {
      alert("No contact details to save yet.");
      return;
    }
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename(`contact-${deal.otherParty || "lead"}`, "vcf");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportTranscript = async () => {
    setExportingTranscript(true);
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      if (!token && typeof window !== "undefined" && isDevelopmentMockAllowed({
        nodeEnv: process.env.NODE_ENV,
        hostname: window.location.hostname,
        userId: mockUserId,
      })) {
        headers["x-mock-user-id"] = mockUserId;
      }
      const res = await fetch(`/api/deals/${deal.id}/export`, { headers });
      if (!res.ok) throw new Error("Failed to export transcript");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript-deal-${deal.id.slice(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingTranscript(false);
    }
  };

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
        await crmFetch(`/api/deals/${deal.id}/notes`, {
          method: "PATCH",
          mockUserId,
          body: { note: newNotes },
        });
        setSavingState("saved");
        setTimeout(() => setSavingState("idle"), 2000);
        if (onDealUpdate) onDealUpdate(deal.id, { private_notes: newNotes });
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
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-sm z-50"
            style={{ background: "var(--modal-scrim)" }}
          />
          
          <motion.div
            initial={reduceMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? { x: 0 } : { x: "100%" }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-surface border-l border-surface-variant z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-surface-variant">
              <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center gap-2">
                Opportunity File
              </h2>
              <button 
                onClick={onClose}
                aria-label="Close"
                className="min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-surface-alt text-text-secondary transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              {/* Status Pill */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs uppercase tracking-widest font-label-caps text-text-secondary">Stage</span>
                <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-widest ${getStatusColor(deal.status)}`}>
                  {deal.status}
                </span>
                {deal.open_gate_inbound && (
                  <span className="px-2.5 py-1 rounded bg-gold-accent/10 border border-gold-accent/30 text-gold-accent text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={12} /> Open Gate
                  </span>
                )}
              </div>

              {/* Property Summary */}
              <div className="bg-surface-alt border border-surface-variant rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center shrink-0">
                    <Building2 className="text-gold-accent" size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-working-title text-lg text-on-surface mb-1 break-words [overflow-wrap:anywhere]">{deal.propertyTitle}</h3>
                    <p className="text-sm text-text-secondary flex items-center gap-1">
                      <MapPin size={14} /> View listing details
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-gradient-to-br from-surface-alt to-surface border border-surface-variant rounded-lg p-5 relative overflow-hidden group hover:border-gold-accent/30 transition">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-surface-variant">
                    <UserCircle2 className="text-text-muted" size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-working-title text-base text-on-surface break-words [overflow-wrap:anywhere]">
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
                {(deal.status === "accepted" || deal.status === "closed") && (
                  <div className="mt-4 pt-4 border-t border-surface-variant flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadVCard}
                      className="min-h-11 px-3 py-1.5 rounded border border-surface-variant bg-surface hover:border-gold-accent/50 text-xs font-mono uppercase text-on-surface flex items-center gap-1.5 transition"
                    >
                      <Download size={14} className="text-gold-accent" /> Save Contact (.vcf)
                    </button>
                  </div>
                )}
              </div>

              {/* Private Notes */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <h3 className="font-working-title text-sm text-on-surface flex items-center gap-2">
                    <FileText size={16} className="text-gold-accent" /> Private Notes
                  </h3>
                  {savingState === "saving" && <span className="text-[12px] uppercase text-text-muted animate-pulse">Saving...</span>}
                  {savingState === "saved" && <span className="text-[12px] uppercase text-success flex items-center gap-1"><CheckCircle2 size={12}/> Saved</span>}
                </div>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Jot down notes about this deal. Only you can see this."
                  className="w-full h-40 bg-surface-alt border border-surface-variant rounded-lg p-4 text-base md:text-sm text-on-surface focus:outline-none focus:border-gold-accent transition resize-none placeholder:text-text-muted"
                />
              </div>

              {/* Evidentiary Transcript Export */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-surface-alt border border-surface-variant">
                <div>
                  <h4 className="font-working-title text-sm text-on-surface flex items-center gap-2">
                    <FileText size={15} className="text-gold-accent" /> Evidentiary Transcript
                  </h4>
                  <p className="text-xs text-text-secondary font-mono mt-0.5">
                    RFC-compliant timestamped legal record (.txt)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportTranscript}
                  disabled={exportingTranscript}
                  className="min-h-11 px-3 py-1.5 rounded border border-surface-variant bg-surface hover:border-gold-accent/50 text-xs font-mono uppercase text-on-surface flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Download size={14} className="text-gold-accent" /> {exportingTranscript ? "Exporting..." : "Export .txt"}
                </button>
              </div>

              {/* Activity — real crm_activity_log rows, newest first */}
              <div>
                <h3 className="font-working-title text-sm text-on-surface flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-gold-accent" /> Activity Timeline
                </h3>
                <DealTimeline dealId={deal.id} mockUserId={mockUserId} />
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
