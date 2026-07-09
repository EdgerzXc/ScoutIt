"use client";

import { useState } from "react";
import Link from "next/link";
import ProfileContactModal from "./ProfileContactModal";
import { MapPin, Calendar, Edit2, MessageSquare } from "lucide-react";

const TIER_CONFIG = {
  universe: { label: "Universe", color: "#E8AE3C", border: "rgba(232, 174, 60,0.4)" },
  cluster:  { label: "Cluster",  color: "#C0C0C0", border: "rgba(192,192,192,0.4)" },
  solar:    { label: "Solar",    color: "#CD7F32", border: "rgba(205,127,50,0.4)" },
  starry:   { label: "Starry",   color: "#888888", border: "rgba(136,136,136,0.3)" },
};

const ROLE_LABELS = {
  buyer:     "Seeker",
  owner:     "Owner",
  broker:    "Broker",
  provider:  "Provider",
  exploring: "Explorer",
};

export default function ProfileBaseLayer({
  profile,
  isOwnView = false,
  publicRoles = [],
}) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  if (!profile) return null;

  const tier = TIER_CONFIG[profile.subscription_tier] ?? TIER_CONFIG.starry;
  const displayRoles = isOwnView
    ? (profile.active_roles ?? [])
    : (profile.active_roles ?? []).filter((r) => publicRoles.includes(r));

  const memberYear = profile.member_since
    ? new Date(profile.member_since).getFullYear()
    : null;

  const initials = profile.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      <section style={baseSection}>
      {/* Avatar */}
      <div style={avatarWrap}>
        {profile.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={avatarInitials}>{initials}</span>
        )}
        {/* Tier ring */}
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            border: `2px solid ${tier.color}`,
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Identity */}
      <div style={identityBlock}>
        <h1 style={nameStyle}>{profile.display_name || "Anonymous"}</h1>

        {/* Tier badge + Example flag — the example badge carries the same
            visual weight as the tier/verification pill, never a tooltip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12, marginTop: 6 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${tier.border}`,
              borderRadius: 20,
              padding: "3px 10px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: tier.color,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: tier.color,
              }}
            >
              {tier.label}
            </span>
          </div>

          {profile.is_example_account && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px dashed rgba(240, 237, 232, 0.45)",
                borderRadius: 20,
                padding: "3px 10px",
                background: "rgba(240, 237, 232, 0.06)",
              }}
              title="This is a seeded demonstration profile, not a real person"
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Example Profile
              </span>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div style={metaRow}>
          {profile.location && (
            <span style={metaItem}>
              <MapPin size={11} strokeWidth={1.5} color="var(--text-secondary)" />
              {profile.location}
            </span>
          )}
          {memberYear && (
            <span style={metaItem}>
              <Calendar size={11} strokeWidth={1.5} color="var(--text-secondary)" />
              Since {memberYear}
            </span>
          )}
        </div>

        {/* Role tags */}
        {displayRoles.length > 0 && (
          <div style={rolesRow}>
            {displayRoles.map((r) => (
              <span key={r} style={roleTag}>
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        {profile.headline && (
          <p style={headline}>{profile.headline}</p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p style={bio}>{profile.bio}</p>
        )}

        {/* Firm / Service */}
        {profile.firm && (
          <p style={firmText}>{profile.firm}</p>
        )}

        {/* Connects — own view only, never on public */}
        {isOwnView && profile.connects_balance != null && (
          <div style={connectsBlock}>
            <span style={{ color: "#E8AE3C", fontFamily: "var(--font-mono)", fontSize: 13 }}>
              ◈ {profile.connects_balance}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Connects
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={actionsRow}>
          {isOwnView ? (
            <Link href="/settings" style={editBtn}>
              <Edit2 size={12} strokeWidth={1.5} />
              Edit Profile
            </Link>
          ) : (
            <button
              style={contactBtn}
              onClick={() => setIsContactModalOpen(true)}
            >
              <MessageSquare size={12} strokeWidth={1.5} />
              Contact
            </button>
          )}
          {isOwnView && (
            <Link href="/settings" style={settingsLink}>
              Settings
            </Link>
          )}
        </div>
      </div>
    </section>

      <ProfileContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        profile={profile}
      />
    </>
  );
}

const baseSection = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 24,
  paddingBottom: 32,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const avatarWrap = {
  position: "relative",
  width: 96,
  height: 96,
  borderRadius: "50%",
  background: "#1e1e1e",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
};

const avatarInitials = {
  fontFamily: "Georgia, serif",
  fontSize: 32,
  color: "#E8AE3C",
  lineHeight: 1,
};

const identityBlock = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  flex: 1,
  width: "100%",
};

const nameStyle = {
  fontFamily: "Georgia, serif",
  fontSize: 36,
  color: "#f0ede8",
  lineHeight: 1.1,
  letterSpacing: "-0.01em",
};

const metaRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  marginBottom: 12,
};

const metaItem = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "var(--text-secondary)",
};

const rolesRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 14,
};

const roleTag = {
  fontFamily: "var(--font-body)",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#E8AE3C",
  border: "1px solid rgba(232, 174, 60,0.25)",
  borderRadius: 20,
  padding: "3px 10px",
};

const headline = {
  fontFamily: "var(--font-body)",
  fontSize: 15,
  color: "#e5e2e1",
  marginBottom: 8,
  lineHeight: 1.5,
};

const bio = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--text-secondary)",
  fontStyle: "italic",
  lineHeight: 1.7,
  marginBottom: 10,
  maxWidth: 560,
};

const firmText = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "var(--text-secondary)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 14,
};

const connectsBlock = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(232, 174, 60,0.07)",
  border: "1px solid rgba(232, 174, 60,0.15)",
  borderRadius: 20,
  padding: "6px 14px",
  marginBottom: 16,
};

const actionsRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 8,
};

const editBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "#E8AE3C",
  border: "1px solid rgba(232, 174, 60,0.3)",
  borderRadius: 20,
  padding: "6px 14px",
  cursor: "pointer",
  textDecoration: "none",
  transition: "background 0.2s",
};

const contactBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "#0e0e0e",
  background: "#E8AE3C",
  border: "none",
  borderRadius: 20,
  padding: "7px 16px",
  cursor: "pointer",
  fontWeight: 600,
};

const settingsLink = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "var(--text-secondary)",
  textDecoration: "none",
  letterSpacing: "0.04em",
};
