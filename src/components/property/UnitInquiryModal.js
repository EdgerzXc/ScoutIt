"use client";

import { useState } from "react";
import { getSession } from "../../lib/authClient";
import "./InquiryModal.css";

// Unit Master Page "Your Move" (SCOUTIT_MASTER_BUILD_SPEC.md §9.3). A single
// target — the unit's operator if delegated, otherwise the building owner —
// so there's no roster step, unlike the property-level InquiryModal. Built as
// its own component (real auth via getSession(), real error handling) rather
// than literally reusing InquiryModal, which is currently a UI mock (fake
// broker roster, a token key nothing else in the app writes to, and it
// swallows all fetch errors) — extending a non-functional mock would ship a
// unit contact flow that looks like it works but doesn't.
export default function UnitInquiryModal({ isOpen, onClose, propertyTitle, propertySlug, unitId, unitName, operatorDisplayName }) {
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

      // Allow mock tests
      const mockUserStr = typeof window !== 'undefined' ? localStorage.getItem('scoutit_user') : null;
      let mockId = null;
      if (mockUserStr) {
          try {
              const u = JSON.parse(mockUserStr);
              mockId = u.id;
          } catch(e) {}
      }

      if (!token && !mockId) {
        setStatus("error");
        setErrorMsg("Please log in to contact " + targetLabel + ".");
        return;
      }

      const res = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
        body: JSON.stringify({ propertySlug, unitId, message, mockOwnerId: mockId }),
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

  if (!isOpen) return null;

  return (
    <div className="inquiry-overlay">
      <div className="inquiry-modal">
        <button className="inquiry-close" onClick={onClose} aria-label="Close">✕</button>

        {status === "success" ? (
          <div className="inquiry-success">
            <div className="success-icon">✓</div>
            <h3>Connection Established</h3>
            <p>
              Your temporary chatbox with {targetLabel} about <strong>{unitName}</strong> is now open. You
              can view it in your <strong>Leads Inbox</strong>.
            </p>
          </div>
        ) : (
          <div className="animate-[fadeIn_0.3s_ease]">
            <div className="inquiry-header">
              <span className="inquiry-tag">1 Connect Required</span>
              <h2>Contact {targetLabel}</h2>
              <p>Start a secure, temporary chat about <strong>{unitName}</strong> at <strong>{propertyTitle}</strong>.</p>
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
                  placeholder={`Hi, I'm interested in ${unitName}. Is it currently available?`}
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
