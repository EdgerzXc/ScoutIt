"use client";

import { useEffect, useRef, useState } from "react";
import { getSession } from "../../lib/authClient";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Check } from "lucide-react";
import GlassPanel from "../ui/GlassPanel";
import { ImpeccableTextArea } from "../ui/ImpeccableInput";
import { ImpeccableButton } from "../ui/ImpeccableButton";
import PrivacyNotice from "../ui/PrivacyNotice";
import { useModalDialog } from "../ui/useModalDialog";
import { stillBackdropVariants, stillPanelVariants, instantDialogTransition } from "@/components/ui/reducedDialogMotion";

// Unit Master Page "Your Move" (SCOUTIT_MASTER_BUILD_SPEC.md §9.3). A single
// target — the unit's operator if delegated, otherwise the building owner —
// so there's no roster step, unlike the property-level InquiryModal. Built as
// its own component (real auth via getSession(), real error handling) rather
// than literally reusing InquiryModal, whose broker-roster step this flow
// doesn't need — extending it would carry a roster with one possible target.

const backdropVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)" }
};

const modalVariants = {
  hidden: { y: 16, scale: 0.95, opacity: 0 },
  visible: { y: 0, scale: 1, opacity: 1 },
  exit: { y: 12, scale: 0.96, opacity: 0 }
};

const modalTransition = { type: "spring", stiffness: 380, damping: 28 };
const backdropTransition = { duration: 0.2 };


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

export default function UnitInquiryModal({ isOpen, onClose, propertyTitle, propertySlug, unitId, unitName, operatorDisplayName, prefillMessage = "" }) {
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState("composing"); // composing, submitting, success, error
  const [errorMsg, setErrorMsg] = useState("");
  const [gate, setGate] = useState({ loading: true, free: false });

  const targetLabel = operatorDisplayName ? operatorDisplayName : "the building owner";
  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    fetch(`/api/property/${encodeURIComponent(propertySlug)}/open-gate?unitId=${encodeURIComponent(unitId)}`, { cache: "no-store" })
      .then(async response => response.ok ? response.json() : { freeContact: false })
      .then(data => { if (live) setGate({ loading: false, free: data.freeContact === true }); })
      .catch(() => { if (live) setGate({ loading: false, free: false }); });
    return () => { live = false; setGate({ loading: true, free: false }); };
  }, [isOpen, propertySlug, unitId]);

  // A-148 (owner spec S2): per-request anonymity, same contract as
  // InquiryModal. Defaults ON, follows the sender's profile, unknown stays
  // checked — failing closed toward concealment (Rule 14).
  const [sendAnonymously, setSendAnonymously] = useState(true);
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch("/api/user/privacy-settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data?.settings && typeof data.settings.isProfilePublic === "boolean") {
          setSendAnonymously(data.settings.isProfilePublic !== true);
        }
      } catch {
        // Unknown stays anonymous.
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Synchronous in-flight latch for a paid action. Deliberately a ref and
  // not state -- see the guard inside handleSubmit.
  const submitInFlightRef = useRef(false);

  // A-153 — Tab stays inside the dialog, Escape closes like the X button.
  const dialogRef = useRef(null);
  useModalDialog(dialogRef, { active: isOpen, onClose });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // A-017: the money guard lives here, not only in the button.
    // `status` is React state and is STALE within a tick -- two clicks
    // dispatched before the next render would both read "composing" and both
    // spend. A ref updates synchronously, so the second call sees the first.
    if (submitInFlightRef.current) return;
    if (gate.loading) return;
    submitInFlightRef.current = true;

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
        body: JSON.stringify({ propertySlug, unitId, message, anonymous: sendAnonymously === true, expectOpenGate: gate.free }),
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
    } finally {
      submitInFlightRef.current = false;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
          style={{ background: "var(--modal-scrim)" }}
          variants={reduceMotion ? stillBackdropVariants : backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={reduceMotion ? instantDialogTransition : backdropTransition}
        >
          <motion.div
            ref={dialogRef}
            className="w-full max-w-[500px]"
            role="dialog"
            aria-modal="true"
            variants={reduceMotion ? stillPanelVariants : modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={reduceMotion ? instantDialogTransition : modalTransition}
          >
            <GlassPanel className="relative p-8 rounded-xl contact-lens-modal" style={{ boxShadow: "var(--shadow-lg)" }}>
              <button
                className="absolute top-5 right-5 text-[#f0ede8]/50 hover:text-white transition-colors"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} aria-hidden="true" />
              </button>

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div 
                    key="success"
                    className="text-center py-10 flex flex-col items-center gap-4"
                    variants={reduceMotion ? stillPanelVariants : successVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 text-success flex items-center justify-center mb-2">
                      <motion.div
                        initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={reduceMotion ? instantDialogTransition : { type: "spring", stiffness: 300, delay: 0.2 }}
                      >
                        <Check size={32} />
                      </motion.div>
                    </div>
                    <h3 className="font-serif text-2xl text-white font-normal">Request Sent</h3>
                    <p className="text-sm text-[#f0ede8]/60 leading-relaxed max-w-sm">
                      Your request to {targetLabel} about <strong className="text-white font-medium">{unitName}</strong> is waiting for their answer. You
                      can view it in your <strong className="text-white font-medium">Leads Inbox</strong>.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="form"
                    variants={reduceMotion ? stillPanelVariants : formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="mb-6">
                      <span className="font-mono text-[12px] text-gold-accent tracking-[0.12em] uppercase block mb-2">
                        {gate.loading ? "Checking contact cost…" : gate.free ? "Open Gate · Free Request" : "1 Connect Required"}
                      </span>
                      <h2 className="font-serif text-[28px] text-[#f0ede8] font-normal mb-1.5">Contact {targetLabel}</h2>
                      <p className="text-sm text-[#f0ede8]/60 leading-relaxed">
                        Start a secure, temporary chat about <strong className="text-white font-medium">{unitName}</strong> at <strong className="text-white font-medium">{propertyTitle}</strong>.
                      </p>
                      <p className="text-xs text-text-secondary mt-3">
                        Your email and phone number are hidden. They will only see your ScoutIt profile until you
                        choose to share contact details in the chat.
                      </p>

                      {/* Transaction Integrity & Security Protocol Warning */}
                      <div className="my-4 p-3.5 bg-white/[0.02] border border-gold-accent/20 rounded-md text-[12px] leading-relaxed text-[#a0a0a0]">
                        <div className="flex items-center gap-1.5 text-gold-accent font-mono font-semibold uppercase tracking-wider mb-1.5 text-[12px]">
                          <span>⚠️ TRANSACTION INTEGRITY & SECURITY PROTOCOL</span>
                        </div>
                        <p className="mb-1.5">
                          <strong>ScoutIt performs baseline verification (PRC checks &amp; identity matching) for listed providers.</strong> Users must perform independent due diligence.
                        </p>
                        <p className="mb-1.5 text-red-400 font-medium">
                          🛑 <strong>NEVER pay upfront reservation fees or deposits</strong> prior to in-person physical inspection and title/contract verification. ScoutIt does not manage or hold funds.
                        </p>
                        <p className="mb-1.5">
                          ⏱️ <strong>No deadline on their reply.</strong> Your request stays open until they answer, and you can withdraw it any time from your inbox. Connects are spent when you send the request, not when it&apos;s accepted — they aren&apos;t returned.
                        </p>
                        <div className="pt-1.5 border-t border-white/5 font-mono text-[12px] text-[#888]">
                          Display-only platform operating in compliance with <strong>RA 9646 (Real Estate Service Act of the Philippines)</strong>.
                        </div>
                      </div>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                      <ImpeccableTextArea
                        label="First Message"
                        name="message"
                        required
                        defaultValue={prefillMessage}
                        placeholder={`Hi, I'm interested in ${unitName}. Is it currently available?`}
                      />

                      {gate.free ? (
                        <p className="text-[13px] text-text-secondary">Your profile privacy setting controls whether your name appears while this free request waits.</p>
                      ) : (
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sendAnonymously === true}
                          onChange={(e) => setSendAnonymously(e.target.checked)}
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                          aria-label="Send this request anonymously"
                        />
                        <span className="text-[13px] text-text-secondary leading-relaxed">
                          Send anonymously — they will see <strong className="text-text-primary font-medium">Anonymous</strong> until
                          they accept, instead of your name.
                        </span>
                      </label>
                      )}

                      {status === "error" && (
                        <p className="text-xs text-error">{errorMsg}</p>
                      )}

                      <ImpeccableButton
                        type="submit"
                        className="mt-2"
                        isLoading={status === "submitting"}
                        disabled={gate.loading}
                      >
                        {gate.loading ? "Checking…" : gate.free ? "Send free request →" : "Spend 1 Connect →"}
                      </ImpeccableButton>
                      {/* A-150: explicit Privacy Policy link (RA 10173 §11). */}
                      <PrivacyNotice />
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
