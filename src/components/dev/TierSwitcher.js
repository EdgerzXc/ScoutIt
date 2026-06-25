"use client";

// ─────────────────────────────────────────────────────────────
// DEV-ONLY tier/role switcher — for testing entitlement gating.
// Hidden from real visitors. Summon it by visiting any page with ?dev=1
// (persists), hide again with ?dev=0. Writes the mock user's tier/role to
// localStorage and reloads so the gates re-read.
// ⚠️ remove before launch — scaffolding.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { TIERS, TIER_LABELS } from "@/lib/entitlements";

const ROLES = ["seeker", "owner", "broker", "photographer", "researcher"];

export default function TierSwitcher() {
  const [active, setActive] = useState(false);
  const [tier, setTier] = useState("starry");
  const [role, setRole] = useState("seeker");

  useEffect(() => {
    try {
      const dev = new URLSearchParams(window.location.search).get("dev");
      if (dev === "1") localStorage.setItem("scoutit_dev", "1");
      if (dev === "0") localStorage.removeItem("scoutit_dev");
      setActive(localStorage.getItem("scoutit_dev") === "1");
      const u = JSON.parse(localStorage.getItem("scoutit_user") || "null");
      if (u) {
        setTier(String(u.subscription_tier || u.tier || "starry").toLowerCase());
        const r = (u.active_roles || u.tags || [])[0];
        if (r) setRole(String(r).toLowerCase());
      }
    } catch {}
  }, []);

  if (!active) return null;

  function apply(nextTier, nextRole) {
    try {
      const u = JSON.parse(localStorage.getItem("scoutit_user") || "null") || { id: "dev-user" };
      u.subscription_tier = nextTier;
      u.tier = nextTier;
      u.active_roles = [nextRole];
      u.tags = [nextRole];
      localStorage.setItem("scoutit_user", JSON.stringify(u));
      window.location.reload();
    } catch {}
  }

  const wrap = {
    position: "fixed", bottom: "16px", left: "16px", zIndex: 99999,
    background: "var(--surface2, #1e1e1e)", border: "1px solid var(--accent-muted, #7a5c00)",
    borderRadius: "8px", padding: "10px 12px", width: "200px",
    fontFamily: "var(--font-mono), monospace", color: "var(--text-secondary, #c8c8c8)",
    boxShadow: "0 8px 24px rgba(0,0,0,.5)",
  };
  const label = { fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent, #ffb800)", marginBottom: "6px", display: "flex", justifyContent: "space-between" };
  const row = { display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" };
  const chip = (on) => ({
    fontSize: "10px", padding: "4px 7px", borderRadius: "4px", cursor: "pointer",
    border: "1px solid " + (on ? "var(--accent, #ffb800)" : "var(--border, rgba(255,255,255,.12))"),
    background: on ? "var(--accent, #ffb800)" : "transparent",
    color: on ? "#0e0e0e" : "var(--text-secondary, #c8c8c8)",
    textTransform: "capitalize",
  });

  return (
    <div style={wrap}>
      <div style={label}><span>Dev · Tier</span><span style={{ cursor: "pointer" }} onClick={() => apply(tier, role)} title="reload">↻</span></div>
      <div style={row}>
        {TIERS.map((t) => (
          <button key={t} style={chip(t === tier)} onClick={() => apply(t, role)}>{TIER_LABELS[t]}</button>
        ))}
      </div>
      <div style={{ ...label, color: "var(--text-muted, rgba(240,237,232,.45))" }}><span>Role</span></div>
      <div style={row}>
        {ROLES.map((r) => (
          <button key={r} style={chip(r === role)} onClick={() => apply(tier, r)}>{r}</button>
        ))}
      </div>
      <div style={{ fontSize: "8px", color: "var(--text-muted, rgba(240,237,232,.45))" }}>?dev=0 to hide · remove before launch</div>
    </div>
  );
}
