"use client";

import { useState } from "react";
import { getSession } from "../../lib/authClient";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import GlassPanel from "../ui/GlassPanel";
import { ImpeccableTextArea } from "../ui/ImpeccableInput";
import { ImpeccableButton } from "../ui/ImpeccableButton";

// Operator-initiated handshake to a building owner (SCOUTIT_MASTER_BUILD_SPEC.md
// §9.2/locked decision #7). Deliberately a separate, lighter component from
// InquiryModal (which is roster-of-brokers specific and has only one target
// here: the building owner) — real auth via getSession(), real error
// handling (no swallowed errors, unlike InquiryModal's current mock).

const backdropVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)" }
};

const modalVariants = {
  hidden: { y: 30, scale: 0.95, opacity: 0 },
  visible: { y: 0, scale: 1, opacity: 1 },
  exit: { y: 20, scale: 0.95, opacity: 0 }
};

const modalTransition = { type: "spring", stiffness: 300, damping: 30 };
const backdropTransition = { duration: 0.4 };

const successVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

const formVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

export default function OperatorRequestModal({ isOpen, onClose, propertyTitle, propertySlug }) {
  const [status, setStatus] = useState("composing"); // composing, submitting, success, error
  const [errorMsg, setErrorMsg] = useState("");

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
        setErrorMsg("Please log in to request to operate this building.");
        return;
      }

      const res = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertySlug, message, role: "operator" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Couldn't send the request.");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("composing");
      }, 3000);
    } catch (err) {
      console.error("Operator request failed", err);
      setStatus("error");
      setErrorMsg("Couldn't send the request — check your connection.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] bg-[#0a0908]/85 flex items-center justify-center p-5"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={backdropTransition}
        >
          <motion.div 
            className="w-full max-w-[500px]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={modalTransition}
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
                    variants={successVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
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
                    <h3 className="font-serif text-2xl text-white font-normal">Request Sent</h3>
                    <p className="text-sm text-[#f0ede8]/60 leading-relaxed max-w-sm">
                      The owner of <strong className="text-white font-medium">{propertyTitle}</strong> can now review your request and choose which
                      units to hand over for you to operate.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="form"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="mb-6">
                      <span className="font-mono text-[10px] text-gold-accent tracking-[0.15em] uppercase block mb-2">
                        1 Connect Required
                      </span>
                      <h2 className="font-serif text-[28px] text-[#f0ede8] font-normal mb-1.5">Request to Operate This Building</h2>
                      <p className="text-sm text-[#f0ede8]/60 leading-relaxed">
                        Ask the owner of <strong className="text-white font-medium">{propertyTitle}</strong> about operating specific units here.
                        They will review your request and pick which units, if any, to delegate to you.
                      </p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                      <ImpeccableTextArea
                        label="First Message"
                        name="message"
                        required
                        placeholder="Hi, we operate co-working spaces in this area and would like to discuss managing units in this building."
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
