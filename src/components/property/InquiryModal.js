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

    // Simulated API call (we will create a mock route later)
    try {
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      data.property = propertyTitle;
      
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

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
            <h3>Inquiry Sent</h3>
            <p>
              {brokerName || "Our broker"} will contact you shortly regarding <strong>{propertyTitle}</strong>.
            </p>
          </div>
        ) : (
          <>
            <div className="inquiry-header">
              <span className="inquiry-tag">ScoutIt Private Intel</span>
              <h2>Schedule a Viewing</h2>
              <p>Request access to <strong>{propertyTitle}</strong>.</p>
            </div>

            <form className="inquiry-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" required placeholder="John Doe" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" required placeholder="john@example.com" />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="tel" name="phone" required placeholder="+63 917 000 0000" />
                </div>
              </div>

              <div className="form-group">
                <label>Target Move-in Date</label>
                <input type="date" name="date" required />
              </div>

              <div className="form-group">
                <label>Message (Optional)</label>
                <textarea 
                  name="message" 
                  rows="3" 
                  placeholder="Any specific requirements or preferred viewing times?"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className={`inquiry-submit ${status === "submitting" ? "loading" : ""}`}
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Transmitting..." : "Send Request →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
