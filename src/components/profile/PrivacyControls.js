"use client";

// RENDERED ON OWN VIEW ONLY — never on public profile.

import { useState } from "react";
import { Shield, Eye, EyeOff, Globe, Lock } from "lucide-react";
import { updatePrivacySettings, updateProfilePublic } from "@/lib/profileClient";

const ROLE_LABELS = {
  buyer:    "Seeker",
  broker:   "Broker",
  provider: "Provider",
  // owner is always hidden from public — no toggle needed
  // exploring is never shown publicly
};

// Roles that can be toggled for public visibility
const TOGGLEABLE_ROLES = ["buyer", "broker", "provider"];

export default function PrivacyControls({
  userId,
  username,
  isProfilePublic,
  privacy,
  activeRoles = [],
  providerType,
  onUpdate,
}) {
  const [publicProfile, setPublicProfile] = useState(isProfilePublic ?? false);
  const [settings, setSettings] = useState({
    anonymous_browsing: privacy?.anonymous_browsing ?? false,
    anonymous_byline: privacy?.anonymous_byline ?? false,
    public_roles: privacy?.public_roles ?? [],
  });
  const [saving, setSaving] = useState(false);

  const hasBuyer     = activeRoles.includes("buyer");
  const hasBroker    = activeRoles.includes("broker");
  const hasProvider  = activeRoles.includes("provider");
  const isResearcher = providerType === "researcher";

  const togglePublicProfile = async () => {
    const next = !publicProfile;
    setPublicProfile(next);
    setSaving(true);
    await updateProfilePublic(userId, next);
    setSaving(false);
    onUpdate?.({ isProfilePublic: next });
  };

  const toggleRole = async (role) => {
    const current = settings.public_roles;
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    const nextSettings = { ...settings, public_roles: next };
    setSettings(nextSettings);
    setSaving(true);
    await updatePrivacySettings(userId, { public_roles: next });
    setSaving(false);
    onUpdate?.({ privacy: nextSettings });
  };

  const toggleSetting = async (key) => {
    const next = !settings[key];
    const nextSettings = { ...settings, [key]: next };
    setSettings(nextSettings);
    setSaving(true);
    await updatePrivacySettings(userId, { [key]: next });
    setSaving(false);
    onUpdate?.({ privacy: nextSettings });
  };

  return (
    <section style={sectionStyle}>
      <div style={sectionHeader}>
        <Shield size={14} strokeWidth={1.5} color="#E8AE3C" />
        <span style={sectionTitle}>Privacy</span>
        {saving && (
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-secondary)", marginLeft: "auto" }}>
            Saving…
          </span>
        )}
      </div>

      {/* Global toggle */}
      <div style={controlBlock}>
        <div style={controlRow} onClick={togglePublicProfile} role="button" aria-pressed={publicProfile} tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && togglePublicProfile()}>
          <div style={controlInfo}>
            <span style={controlLabel}>
              {publicProfile ? <Globe size={12} strokeWidth={1.5} color="#E8AE3C" /> : <Lock size={12} strokeWidth={1.5} color="var(--text-secondary)" />}
              Public Profile
            </span>
            <span style={controlDesc}>
              {publicProfile
                ? `Your profile is discoverable at /profile/${username || "you"}`
                : "Your profile has no public URL and is not discoverable."}
            </span>
          </div>
          <Toggle on={publicProfile} />
        </div>
      </div>

      {/* Role visibility */}
      {publicProfile && (
        <div style={controlBlock}>
          <p style={blockLabel}>Role Visibility on Public Profile</p>
          <p style={blockDesc}>
            Seeker and Owner roles are always hidden from public view — no toggle needed.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {TOGGLEABLE_ROLES.filter((r) => activeRoles.includes(r)).map((role) => (
              <div
                key={role}
                style={controlRow}
                onClick={() => toggleRole(role)}
                role="checkbox"
                aria-checked={settings.public_roles.includes(role)}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && toggleRole(role)}
              >
                <span style={controlLabel}>Show {ROLE_LABELS[role]} role publicly</span>
                <Toggle on={settings.public_roles.includes(role)} small />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role-specific privacy */}
      {(hasBuyer || isResearcher) && (
        <div style={controlBlock}>
          <p style={blockLabel}>Role-Specific Privacy</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {hasBuyer && (
              <div
                style={controlRow}
                onClick={() => toggleSetting("anonymous_browsing")}
                role="switch"
                aria-checked={settings.anonymous_browsing}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && toggleSetting("anonymous_browsing")}
              >
                <div style={controlInfo}>
                  <span style={controlLabel}>
                    {settings.anonymous_browsing
                      ? <EyeOff size={12} strokeWidth={1.5} color="#E8AE3C" />
                      : <Eye size={12} strokeWidth={1.5} color="var(--text-secondary)" />}
                    Anonymous Browsing
                  </span>
                  <span style={controlDesc}>Property views are not logged to your name.</span>
                </div>
                <Toggle on={settings.anonymous_browsing} />
              </div>
            )}
            {isResearcher && (
              <div
                style={controlRow}
                onClick={() => toggleSetting("anonymous_byline")}
                role="switch"
                aria-checked={settings.anonymous_byline}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && toggleSetting("anonymous_byline")}
              >
                <div style={controlInfo}>
                  <span style={controlLabel}>
                    {settings.anonymous_byline
                      ? <EyeOff size={12} strokeWidth={1.5} color="#E8AE3C" />
                      : <Eye size={12} strokeWidth={1.5} color="var(--text-secondary)" />}
                    Anonymous Byline
                  </span>
                  <span style={controlDesc}>Intel articles display as &ldquo;Verified Researcher&rdquo;.</span>
                </div>
                <Toggle on={settings.anonymous_byline} />
              </div>
            )}
          </div>
        </div>
      )}

      <p style={hardRulesNote}>
        Connects balance, Seeker activity, and Owner listings are never shown on your public profile.
      </p>
    </section>
  );
}

function Toggle({ on, small = false }) {
  const w = small ? 28 : 34;
  const h = small ? 16 : 20;
  const dot = small ? 10 : 14;
  const gap = 3;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: h,
        background: on ? "rgba(232, 174, 60,0.25)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${on ? "rgba(232, 174, 60,0.5)" : "rgba(255,255,255,0.1)"}`,
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s, border-color 0.2s",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: (h - dot) / 2 - 1,
          left: on ? w - dot - gap : gap,
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: on ? "#E8AE3C" : "rgba(255,255,255,0.25)",
          transition: "left 0.2s cubic-bezier(0.4,0,0.2,1), background 0.2s",
        }}
      />
    </div>
  );
}

const sectionStyle = {
  background: "#161616",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 6,
  padding: 24,
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
};

const sectionTitle = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#E8AE3C",
};

const controlBlock = {
  borderTop: "1px solid rgba(255,255,255,0.04)",
  paddingTop: 16,
  marginTop: 16,
};

const controlRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "10px 0",
  cursor: "pointer",
  userSelect: "none",
};

const controlInfo = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  flex: 1,
};

const controlLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "#e5e2e1",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const controlDesc = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

const blockLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "var(--text-secondary)",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const blockDesc = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "rgba(255,255,255,0.25)",
  fontStyle: "italic",
  marginBottom: 10,
};

const hardRulesNote = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "rgba(255,255,255,0.2)",
  borderTop: "1px solid rgba(255,255,255,0.04)",
  paddingTop: 14,
  marginTop: 16,
  lineHeight: 1.5,
};
