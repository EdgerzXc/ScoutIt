"use client";

import { useState } from "react";
import { getSession } from "../../lib/authClient";
import "./InquiryModal.css";

// Direct buyer -> owner contact (the property-level "Inquire" CTA). Previously
// this component showed a fake "select a broker" roster (MOCK_ROSTER, never
// real data), read a token from a localStorage key nothing else in the app
// ever wrote to, and unconditionally showed "success" even when the fetch
// failed or threw -- every inquiry sent through it was silently lost while
// the buyer saw a fake confirmation. /api/deals/initiate has no concept of
// picking a broker anyway (it only ever creates buyer_id + property_id), so
// there was nothing real for the roster step to route to. Rebuilt to match
// the real pattern already proven in UnitInquiryModal.js / OperatorRequestModal.js:
// real getSession() auth, real error states, no swallowed failures.
import { motion, AnimatePresence } from "framer-motion";

export default function InquiryModal({ isOpen, onClose, propertyTitle, propertySlug }) {
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
        setErrorMsg("Please log in to contact the owner.");
        return;
      }

      const res = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertySlug, message }),
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
      console.error("Inquiry failed", err);
      setStatus("error");
      setErrorMsg("Couldn't send your message — check your connection.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="inquiry-overlay"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className="inquiry-modal"
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button className="inquiry-close" onClick={onClose}>
              ✕
            </button>

            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div 
                  key="success"
                  className="inquiry-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <div className="success-icon">✓</div>
                  <h3>Connection Established</h3>
                  <p>
                    Your temporary chatbox with the owner of <strong>{propertyTitle}</strong> is now open. You
                    can view it in your <strong>Leads Inbox</strong>.
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="inquiry-header">
                    <span className="inquiry-tag">1 Connect Required</span>
                    <h2>Contact the Owner</h2>
                    <p>Start a secure, temporary chat to ask about <strong>{propertyTitle}</strong>.</p>
                    <p className="text-xs text-text-secondary mt-2">
                      Your email and phone number are hidden. They will only see your ScoutIt profile until you
                      choose to share contact details in the chat.
                    </p>
                  </div>

                  <form className="inquiry-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>First Message</label>
                      <textarea
                        name="message"
                        rows="4"
                        required
                        placeholder="Hi, I am interested in viewing this property. Are there any available schedules this week?"
                      ></textarea>
                    </div>

                    {status === "error" && (
                      <p className="text-xs text-error mb-3">{errorMsg}</p>
                    )}

                    <motion.button
                      type="submit"
                      className={`inquiry-submit ${status === "submitting" ? "loading" : ""}`}
                      disabled={status === "submitting"}
                      whileHover={{ scale: 1.02, boxShadow: "0px 0px 15px rgba(232, 174, 60, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {status === "submitting" ? "Connecting..." : "Spend 1 Connect →"}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
