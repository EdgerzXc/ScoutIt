"use client";

import { useState } from "react";
import "./InquiryModal.css";

export default function InquiryModal({ isOpen, onClose, propertyTitle, brokerName }) {
  const [status, setStatus] = useState("idle"); // idle, submitting, success

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Call the new initiate API
    try {
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      
      const token = localStorage.getItem("supabase_session_token"); // Assuming token is stored here or similar logic
      
      const res = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          listingId: propertyTitle, // Normally a UUID, mock uses title
          message: data.message
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to initiate deal");
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("idle");
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus("idle");
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
              Your temporary chatbox is now open. You can view it in your <strong>Leads Inbox</strong>.
            </p>
          </div>
        ) : (
          <>
              <div className="inquiry-header">
              <span className="inquiry-tag">1 Connect Required</span>
              <h2>Contact Owner</h2>
              <p>Start a secure, temporary chat to ask about <strong>{propertyTitle}</strong>.</p>
              <p className="text-xs text-text-secondary mt-2">
                Your email and phone number are hidden. The owner will only see your ScoutIt profile until you choose to share contact details in the chat.
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



              <button 
                type="submit" 
                className={`inquiry-submit ${status === "submitting" ? "loading" : ""}`}
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Connecting..." : "Spend 1 Connect →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
