"use client";

import { useEffect, useState } from "react";

export default function AccessibilityToggle() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read from localStorage on mount
    const savedPreference = localStorage.getItem("scoutit_accessibility_mode");
    if (savedPreference === "high-contrast") {
      setIsHighContrast(true);
      document.body.classList.add("high-contrast");
    }
  }, []);

  const toggleMode = () => {
    if (isHighContrast) {
      document.body.classList.remove("high-contrast");
      localStorage.setItem("scoutit_accessibility_mode", "default");
      setIsHighContrast(false);
    } else {
      document.body.classList.add("high-contrast");
      localStorage.setItem("scoutit_accessibility_mode", "high-contrast");
      setIsHighContrast(true);
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleMode}
      aria-label="Toggle High Contrast Mode"
      title={isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
      style={{
        position: "fixed",
        bottom: "24px",
        left: "24px",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: isHighContrast ? "var(--accent)" : "rgba(0, 0, 0, 0.6)",
        border: `1px solid ${isHighContrast ? "#000" : "rgba(255, 184, 0, 0.3)"}`,
        color: isHighContrast ? "#000" : "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 99999,
        backdropFilter: "blur(4px)",
        boxShadow: isHighContrast ? "0 0 20px rgba(255, 184, 0, 0.5)" : "0 4px 12px rgba(0,0,0,0.5)",
        transition: "all 0.3s ease"
      }}
    >
      {isHighContrast ? (
        // Eye solid icon (enabled)
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      ) : (
        // Eye outline icon (disabled)
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      )}
    </button>
  );
}
