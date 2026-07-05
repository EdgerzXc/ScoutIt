"use client";

import { useState } from "react";
import { getSession } from "../../lib/authClient";
import "./InquiryModal.css";

// Operator-initiated handshake to a building owner (SCOUTIT_MASTER_BUILD_SPEC.md
// §9.2/locked decision #7). Deliberately a separate, lighter component from
// InquiryModal (which is roster-of-brokers specific and has only one target
// here: the building owner) — real auth via getSession(), real error
// handling (no swallowed errors, unlike InquiryModal's current mock).
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

  if (!isOpen) return null;

  return (
    <div className="inquiry-overlay">
      <div className="inquiry-modal">
        <button className="inquiry-close" onClick={onClose} aria-label="Close">✕</button>

        {status === "success" ? (
          <div className="inquiry-success">
            <div className="success-icon">✓</div>
            <h3>Request Sent</h3>
            <p>
              The owner of <strong>{propertyTitle}</strong> can now review your request and choose which
              units to hand over for you to operate.
            </p>
          </div>
        ) : (
          <div className="animate-[fadeIn_0.3s_ease]">
            <div className="inquiry-header">
              <span className="inquiry-tag">1 Connect Required</span>
              <h2>Request to Operate This Building</h2>
              <p>
                Ask the owner of <strong>{propertyTitle}</strong> about operating specific units here.
                They will review your request and pick which units, if any, to delegate to you.
              </p>
            </div>

            <form className="inquiry-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>First Message</label>
                <textarea
                  name="message"
                  rows="4"
                  required
                  placeholder="Hi, we operate co-working spaces in this area and would like to discuss managing units in this building."
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
                {status === "submitting" ? "Sending…" : "Spend 1 Connect →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
