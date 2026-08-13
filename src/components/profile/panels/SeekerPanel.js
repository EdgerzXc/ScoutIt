"use client";

// PRIVATE ONLY — never rendered on public profile view.
// This panel is enforced at the page level, not just here.

import Link from "next/link";
import { Bookmark, Search, Share2 } from "lucide-react";
import { useState } from "react";
import { getSession } from "@/lib/authClient";

export default function SeekerPanel({ savedCount = 0, isAnonymous = false }) {
  const [shareLink, setShareLink] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const shareRequest = async (method) => {
    const { data } = await getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("Sign in again to manage shared links.");
    const response = await fetch("/api/wishlist/share", {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not manage shared links.");
    return body;
  };

  const handleGenerateLink = async () => {
    setGenerating(true);
    setShareMessage("");
    try {
      const data = await shareRequest("POST");
      if (data.shareToken) {
        setShareLink(`${window.location.origin}/wishlist/shared/${data.shareToken}`);
        setShareMessage("A new 90-day link is ready. Older deactivated links stay closed.");
      }
    } catch (error) {
      setShareMessage(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeLinks = async () => {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      setShareMessage("Select confirm to deactivate every Board link you shared before now.");
      return;
    }

    setGenerating(true);
    setShareMessage("");
    try {
      await shareRequest("DELETE");
      setShareLink(null);
      setCopied(false);
      setShareMessage("All previously shared Board links are now deactivated.");
    } catch (error) {
      setShareMessage(error.message);
    } finally {
      setGenerating(false);
      setConfirmRevoke(false);
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          <span style={statLabel}>Your Board</span>
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
            Share Your Board
          </span>
        </div>
        <div style={shareActions}>
          <button
            type="button"
            onClick={shareLink ? copyToClipboard : handleGenerateLink}
            disabled={generating}
            style={{
              ...shareButton,
              color: copied ? "var(--success)" : "var(--accent)",
              opacity: generating ? 0.55 : 1,
            }}
          >
            {generating
              ? "Working…"
              : shareLink
                ? copied ? "Copied" : "Copy link"
                : "Create 90-day link"}
          </button>
          <button
            type="button"
            onClick={handleRevokeLinks}
            disabled={generating}
            style={revokeButton}
          >
            {confirmRevoke ? "Confirm deactivation" : "Deactivate links"}
          </button>
        </div>
      </div>
      {shareMessage && <p role="status" style={shareStatus}>{shareMessage}</p>}

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
  fontFamily: "var(--font-display)",
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

const shareActions = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 8,
};

const shareButton = {
  minHeight: 36,
  padding: "7px 12px",
  border: "1px solid rgba(var(--accent-rgb), 0.3)",
  borderRadius: 20,
  background: "rgba(var(--accent-rgb), 0.06)",
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const revokeButton = {
  ...shareButton,
  color: "var(--text-secondary)",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "transparent",
};

const shareStatus = {
  margin: "-2px 0 12px",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-body)",
  fontSize: 11,
  lineHeight: 1.5,
};

const anonNotice = {
  marginTop: 12,
  padding: "8px 12px",
  background: "rgba(232, 174, 60,0.04)",
  border: "1px solid rgba(232, 174, 60,0.1)",
  borderRadius: 4,
};
