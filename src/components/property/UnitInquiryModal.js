"use client";

import { useState } from "react";
import { getSession } from "../../lib/authClient";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import GlassPanel from "../ui/GlassPanel";
import { ImpeccableTextArea } from "../ui/ImpeccableInput";
import { ImpeccableButton } from "../ui/ImpeccableButton";

// Unit Master Page "Your Move" (SCOUTIT_MASTER_BUILD_SPEC.md §9.3). A single
// target — the unit's operator if delegated, otherwise the building owner —
// so there's no roster step, unlike the property-level InquiryModal. Built as
// its own component (real auth via getSession(), real error handling) rather
// than literally reusing InquiryModal, which is currently a UI mock (fake
// broker roster, a token key nothing else in the app writes to, and it
// swallows all fetch errors) — extending a non-functional mock would ship a
// unit contact flow that looks like it works but doesn't.
export default function UnitInquiryModal({ isOpen, onClose, propertyTitle, propertySlug, unitId, unitName, operatorDisplayName, prefillMessage = "" }) {
  const [status, setStatus] = useState("composing"); // composing, submitting, success, error
  const [errorMsg, setErrorMsg] = useState("");

  const targetLabel = operatorDisplayName ? operatorDisplayName : "the building owner";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const formData = new FormData(e.target);
      const message = formData.get("message");

      const { data: { session } } = await getSession();
      const token = session?.access_token;
      if (!token) {
        setStatus("error");
        setErrorMsg("Please log in to contact " + targetLabel + ".");
        return;
      }

      const res = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertySlug, unitId, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Couldn't send your message.");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("composing");
      }, 3000);
    } catch (err) {
      console.error("Unit inquiry failed", err);
      setStatus("error");
      setErrorMsg("Couldn't send your message — check your connection.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] bg-[#0a0908]/85 flex items-center justify-center p-5"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="w-full max-w-[500px]"
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <GlassPanel className="relative p-8 rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
              <button 
                className="absolute top-5 right-5 text-[#f0ede8]/50 hover:text-white transition-colors"
                onClick={onClose} 
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div 
                    key="success"
                    className="text-center py-10 flex flex-col items-center gap-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 text-success flex items-center justify-center mb-2">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                      >
                        <Check size={32} />
                      </motion.div>
                    </div>
                    <h3 className="font-serif text-2xl text-white font-normal">Connection Established</h3>
                    <p className="text-sm text-[#f0ede8]/60 leading-relaxed max-w-sm">
                      Your temporary chatbox with {targetLabel} about <strong className="text-white font-medium">{unitName}</strong> is now open. You
                      can view it in your <strong className="text-white font-medium">Leads Inbox</strong>.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="mb-6">
                      <span className="font-mono text-[10px] text-gold-accent tracking-[0.15em] uppercase block mb-2">
                        1 Connect Required
                      </span>
                      <h2 className="font-serif text-[28px] text-[#f0ede8] font-normal mb-1.5">Contact {targetLabel}</h2>
                      <p className="text-sm text-[#f0ede8]/60 leading-relaxed">
                        Start a secure, temporary chat about <strong className="text-white font-medium">{unitName}</strong> at <strong className="text-white font-medium">{propertyTitle}</strong>.
                      </p>
                      <p className="text-xs text-text-secondary mt-3">
                        Your email and phone number are hidden. They will only see your ScoutIt profile until you
                        choose to share contact details in the chat.
                      </p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                      <ImpeccableTextArea
                        label="First Message"
                        name="message"
                        required
                        defaultValue={prefillMessage}
                        placeholder={`Hi, I'm interested in ${unitName}. Is it currently available?`}
                      />

                      {status === "error" && (
                        <p className="text-xs text-error">{errorMsg}</p>
                      )}

                      <ImpeccableButton
                        type="submit"
                        className="mt-2"
                        isLoading={status === "submitting"}
                      >
                        Spend 1 Connect →
                      </ImpeccableButton>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
