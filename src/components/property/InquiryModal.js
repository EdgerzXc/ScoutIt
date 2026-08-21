"use client";

import { useState } from "react";
import { getSession } from "../../lib/authClient";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import GlassPanel from "../ui/GlassPanel";
import { ImpeccableTextArea } from "../ui/ImpeccableInput";
import { ImpeccableButton } from "../ui/ImpeccableButton";
import { trackFrictionPoint } from "@/lib/deviceTracker";
import { INTRO_MAX } from "@/lib/connectIntro";
import ConnectsReceipt from "../connects/ConnectsReceipt";
import { trackEvent, GA_EVENTS } from "@/lib/analytics";

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
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export default function InquiryModal({ isOpen, onClose, propertyTitle, propertySlug, defaultMessage = "" }) {
  const [status, setStatus] = useState("composing"); // composing, submitting, success, error
  const [errorMsg, setErrorMsg] = useState("");
  // NEW_IDEAS.md §38.3 State 1 — this is the pre-acceptance intro, the only
  // thing a recipient reads before deciding whether to open the conversation.
  // Capped because it is shown on a request card, not in a chat thread: an
  // uncapped wall of text either overflows that card or has to be truncated,
  // and truncating the message someone spent a Connect on is worse than
  // making them edit it.
  const [message, setMessage] = useState(defaultMessage || "");
  // Server-issued spend receipt (§38.2). Null until /api/deals/initiate
  // answers — there is deliberately no default shape, so the receipt cannot
  // render invented figures if the call fails.
  const [receipt, setReceipt] = useState(null);

  // Sync default message when modal opens with new pre-filled finding
  useEffect(() => {
    if (isOpen && defaultMessage && !message) {
      setMessage(defaultMessage);
    }
  }, [isOpen, defaultMessage, message]);

  const handleCloseModal = () => {
    if (status === "composing") {
      trackFrictionPoint("abandoned_inquiry_modal", { propertyTitle, propertySlug });
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const trimmed = message.trim();
      if (!trimmed) {
        setStatus("error");
        setErrorMsg("Write a short message so they know what you're asking about.");
        return;
      }
      if (trimmed.length > INTRO_MAX) {
        setStatus("error");
        setErrorMsg(`Keep it under ${INTRO_MAX} characters.`);
        return;
      }

      const { data: { session } } = await getSession();
      const token = session?.access_token;
      let mockOwnerId = null;
      
      if (!token) {
        // Fallback for E2E tests
        try {
          const stored = window.localStorage.getItem('scoutit_user');
          if (stored) {
            mockOwnerId = JSON.parse(stored).id;
          }
        } catch (e) {}

        if (!mockOwnerId) {
          setStatus("error");
          setErrorMsg("Please log in to contact the property recipient.");
          return;
        }
      }

      const res = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ propertySlug, message: trimmed, mockOwnerId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Couldn't send your message.");
        return;
      }

      // Hold the SERVER's numbers verbatim. §38.2: "This is the source of
      // truth displayed in the receipt — never a client-computed balance."
      setReceipt({
        connects_spent: data.connects_spent,
        connects_remaining: data.connects_remaining,
        dealId: data.dealId,
      });
      setStatus("success");
      trackEvent(GA_EVENTS.INQUIRY_SENT, { channel: 'deal_intro', property_slug: propertySlug, connects_spent: data.connects_spent });
      // No auto-dismiss. The previous 3s timer yanked the confirmation away
      // while the user was still reading it — on a receipt for real currency,
      // that is the one thing it must not do. They close it when they're done.
    } catch (err) {
      console.error("Inquiry failed", err);
      setStatus("error");
      setErrorMsg("Couldn't send your message — check your connection.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] bg-[#0a0908]/85 flex items-center justify-center overflow-y-auto p-5"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={backdropTransition}
        >
          <motion.div 
            className="my-auto w-full max-w-[500px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-modal-title"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={modalTransition}
          >
            <GlassPanel className="relative max-h-[calc(100dvh-2.5rem)] overflow-y-auto p-8 rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
              <button 
                className="absolute top-5 right-5 text-[#f0ede8]/50 hover:text-white transition-colors"
                onClick={handleCloseModal}
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
                    {/* Was a generic "Connection Established" panel that
                        quoted no figure at all and told the user their chatbox
                        was "now open" — untrue the moment §40.9 lands, and
                        misleading today because the recipient hasn't agreed to
                        anything. Replaced with the real §38.2 receipt. */}
                    <ConnectsReceipt
                      receipt={receipt}
                      propertyTitle={propertyTitle}
                      /* No recipientLabel: this modal genuinely does not know
                         who the lead routed to — /api/deals/initiate resolves
                         that server-side against the broker roster. The
                         receipt omits the row rather than guessing "Owner". */
                      onDismiss={onClose}
                    />
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
                      <h2 id="inquiry-modal-title" className="font-serif text-[28px] text-[#f0ede8] font-normal mb-1.5">Contact the Property Recipient</h2>
                      <p className="text-sm text-[#f0ede8]/60 leading-relaxed">
                        Start a secure, temporary chat with the current recipient for <strong className="text-white font-medium">{propertyTitle}</strong>.
                      </p>
                      <p className="text-xs text-text-secondary mt-3">
                        Your email and phone number are hidden. They will only see your ScoutIt profile until you
                        choose to share contact details in the chat.
                      </p>

                      {/* Transaction Integrity & Security Protocol Warning */}
                      <div className="my-4 p-3.5 bg-white/[0.02] border border-gold-accent/20 rounded-md text-[11px] leading-relaxed text-[#a0a0a0]">
                        <div className="flex items-center gap-1.5 text-gold-accent font-mono font-semibold uppercase tracking-wider mb-1.5 text-[10px]">
                          <span>⚠️ TRANSACTION INTEGRITY & SECURITY PROTOCOL</span>
                        </div>
                        <p className="mb-1.5">
                          <strong>ScoutIt performs baseline verification (PRC checks &amp; identity matching) for listed providers.</strong> Users must perform independent due diligence.
                        </p>
                        <p className="mb-1.5 text-red-400 font-medium">
                          🛑 <strong>NEVER pay upfront reservation fees or deposits</strong> prior to in-person physical inspection and title/contract verification. ScoutIt does not manage or hold funds.
                        </p>
                        {/* Was a "7-Day Purge Window ... permanently deleted
                            forever" claim -- a fifth, different retention
                            promise on top of the four §40.6 found in the chat
                            itself, and nothing in the codebase deletes
                            messages on a 7-day timer. Stating a deletion
                            guarantee we do not implement is a data-protection
                            claim we cannot honour under RA 10173. */}
                        <p className="mb-1.5">
                          ⏱️ <strong>No deadline on their reply.</strong> Your request stays open until they answer, and you can withdraw it any time from your inbox. Connects are spent when you send the request, not when it&apos;s accepted — they aren&apos;t returned.
                        </p>
                        <div className="pt-1.5 border-t border-white/5 font-mono text-[9px] text-[#888]">
                          Display-only platform operating in compliance with <strong>RA 9646 (Real Estate Service Act of the Philippines)</strong>.
                        </div>
                      </div>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                      <ImpeccableTextArea
                        label="First Message"
                        name="message"
                        required
                        maxLength={INTRO_MAX}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hi, I am interested in viewing this property. Are there any available schedules this week?"
                      />
                      <div className="flex justify-between items-center -mt-2">
                        <p className="text-[10px] text-text-muted">
                          They see this before deciding whether to reply.
                        </p>
                        <span
                          className={`text-[10px] font-mono tabular-nums ${
                            message.length > INTRO_MAX - 40 ? "text-gold-accent" : "text-text-muted"
                          }`}
                        >
                          {message.length}/{INTRO_MAX}
                        </span>
                      </div>

                      {status === "error" && (
                        <p className="text-xs text-error">{errorMsg}</p>
                      )}

                      <ImpeccableButton
                        type="submit"
                        className="mt-2"
                        isLoading={status === "submitting"}
                        data-scoutit-guide="send-inquiry-modal-btn"
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
