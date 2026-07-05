"use client";

// PRIVATE ONLY — never rendered on public profile view.
// This panel is enforced at the page level, not just here.

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Search, Share2, Copy, Check, Loader2 } from "lucide-react";

export default function SeekerPanel({ savedCount = 0, isAnonymous = false }) {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateLink = async () => {
    setLoading(true);
    setError("");
    try {
      const rawUser = localStorage.getItem("scoutit_user");
      if (!rawUser) throw new Error("Please log in to share your board.");
      const user = JSON.parse(rawUser);

      const sbKey = Object.keys(localStorage).find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
      let token = "";
      if (sbKey) {
        const sessionStr = localStorage.getItem(sbKey);
        if (sessionStr) {
          const sessionData = JSON.parse(sessionStr);
          token = sessionData.access_token;
        }
      }

      const res = await fetch("/api/wishlist/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        const link = `${window.location.origin}/wishlist/shared/${data.shareToken}`;
        setShareLink(link);
      }
    } catch (err) {
      setError(err.message || "Failed to generate link.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bookmark size={14} strokeWidth={1.5} color="#E8AE3C" />
          <span style={panelLabel}>Seeker</span>
        </div>
        <span style={privateBadge}>Private</span>
      </div>

      <div style={statsRow}>
        <div style={statCard}>
          <Bookmark size={14} strokeWidth={1.5} color="#E8AE3C" style={{ marginBottom: 6 }} />
          <span style={statValue}>{savedCount}</span>
          <span style={statLabel}>Saved Properties</span>
        </div>
        <div style={statCard}>
          <Search size={14} strokeWidth={1.5} color="rgba(232, 174, 60,0.4)" style={{ marginBottom: 6 }} />
          <span style={{ ...statValue, color: "var(--text-secondary)" }}>—</span>
          <span style={statLabel}>Active Searches</span>
        </div>
      </div>

      <div style={wishlistRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Share2 size={13} strokeWidth={1.5} color="var(--text-secondary)" />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)" }}>
            Wishlist Share
          </span>
        </div>

        {shareLink ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(232, 174, 60, 0.05)", border: "1px solid rgba(232, 174, 60, 0.2)", borderRadius: 20, padding: "4px 6px 4px 12px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#E8AE3C", letterSpacing: "0.05em", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {shareLink.split('/').pop().substring(0, 8)}...
            </span>
            <button
              onClick={copyToClipboard}
              aria-label="Copy Link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: copied ? "#E8AE3C" : "rgba(232, 174, 60, 0.1)",
                color: copied ? "#000" : "#E8AE3C",
                border: "none",
                borderRadius: 16,
                padding: "4px 8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: loading ? "rgba(232, 174, 60, 0.5)" : "#E8AE3C",
                border: "1px solid rgba(232, 174, 60, 0.3)",
                borderRadius: 20,
                padding: "4px 12px",
                cursor: loading ? "wait" : "pointer",
                background: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease"
              }}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : null}
              Generate Link
            </button>
            {error && <span style={{ fontSize: 9, color: "#ef4444" }}>{error}</span>}
          </div>
        )}

      </div>

      {isAnonymous && (
        <div style={anonNotice}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)" }}>
            Anonymous Browsing is active. Property views are not logged to your name.
          </span>
        </div>
      )}
    </section>
  );
}

const panelStyle = {
  background: "linear-gradient(165deg, #1a1917, #111110)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 6,
  padding: 24,
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
};

const panelLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#E8AE3C",
};

const privateBadge = {
  fontFamily: "var(--font-body)",
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "2px 8px",
  borderRadius: 20,
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
  marginBottom: 16,
};

const statCard = {
  background: "linear-gradient(165deg, #1a1917, #111110)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4,
  padding: "14px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const statValue = {
  fontFamily: "Georgia, serif",
  fontSize: 28,
  color: "#e5e2e1",
  lineHeight: 1.2,
};

const statLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  color: "var(--text-secondary)",
  letterSpacing: "0.06em",
  marginTop: 2,
};

const wishlistRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 0",
  borderTop: "1px solid rgba(255,255,255,0.04)",
};

const anonNotice = {
  marginTop: 12,
  padding: "8px 12px",
  background: "rgba(232, 174, 60,0.04)",
  border: "1px solid rgba(232, 174, 60,0.1)",
  borderRadius: 4,
};
