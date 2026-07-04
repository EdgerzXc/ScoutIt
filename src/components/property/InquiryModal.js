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

  if (!isOpen) return null;

  return (
    <div className="inquiry-overlay">
      <div className="inquiry-modal">
        <button className="inquiry-close" onClick={onClose}>
          ✕
        </button>

        {status === "success" ? (
          <div className="inquiry-success">
            <div className="success-icon">✓</div>
            <h3>Connection Established</h3>
            <p>
              Your temporary chatbox with the owner of <strong>{propertyTitle}</strong> is now open. You
              can view it in your <strong>Leads Inbox</strong>.
            </p>
          </div>
        ) : (
          <div className="animate-[fadeIn_0.3s_ease]">
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

              <button
                type="submit"
                className={`inquiry-submit ${status === "submitting" ? "loading" : ""}`}
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Connecting..." : "Spend 1 Connect →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
