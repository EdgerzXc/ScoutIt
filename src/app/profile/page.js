"use client";

// /profile — OWN VIEW (A-138)
// How others see you, read from your account. Editing happens in Settings.
//
// This page used to read the browser's `scoutit_user` copy and write it back
// into the account on every visit (`upsertProfile`). That reverted Settings
// edits, blanked any field the copy lacked, let the editable copy re-add a
// gated role past A-137's licence check, and sent signed-in people on a new
// device to onboarding. It now reads only the account, and writes no profile
// field. The private Seeker / Owner panels were removed with it: they repeated
// the dashboard's numbers and never appear to anyone else.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProfileBaseLayer from "@/components/profile/ProfileBaseLayer";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import BrokerPanel from "@/components/profile/panels/BrokerPanel";
import PhotographerPanel from "@/components/profile/panels/PhotographerPanel";
import ResearcherPanel from "@/components/profile/panels/ResearcherPanel";
import { getUser } from "@/lib/authClient";
import {
  loadOwnProfile,
  loadPrivacySettings,
  loadBrokerProfile,
  loadResearcherProfile,
  loadPhotographerProjects,
} from "@/lib/profileClient";

export default function OwnProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [profile, setProfile] = useState(null);
  const [privacy, setPrivacy] = useState(null);
  const [brokerData, setBrokerData] = useState(null);
  const [researcherData, setResearcherData] = useState(null);
  const [photographerProjects, setPhotographerProjects] = useState([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } = {} } = await getUser();
      if (!user) {
        router.push("/onboarding");
        return;
      }

      const { data: activeProfile, error } = await loadOwnProfile(user.id);
      if (error || !activeProfile) {
        setLoadError("We couldn't load your profile. Refresh the page, or try again in a moment.");
        setLoading(false);
        return;
      }
      setProfile(activeProfile);

      const roles = activeProfile.active_roles || [];
      const provType = activeProfile.provider_type;

      const [privacyResult, brokerResult, researcherResult, photoProjResult] = await Promise.all([
        // Tier + role decide only the INITIAL state of the anonymity shield
        // (§46.8) — Cluster+ seekers and owners start with it on. The tier now
        // comes from the account, not the browser copy. The toggle itself stays
        // free for everyone at every tier.
        loadPrivacySettings(user.id, {
          tier: activeProfile.subscription_tier,
          role: roles[0],
        }),
        roles.includes("broker") ? loadBrokerProfile(user.id) : Promise.resolve({ data: null }),
        roles.includes("provider") && provType === "researcher"
          ? loadResearcherProfile(user.id)
          : Promise.resolve({ data: null }),
        roles.includes("provider") && provType === "photographer"
          ? loadPhotographerProjects(user.id)
          : Promise.resolve({ data: [] }),
      ]);

      setPrivacy(privacyResult.data);
      setBrokerData(brokerResult.data);
      setResearcherData(researcherResult.data);
      setPhotographerProjects(photoProjResult.data ?? []);
      setLoading(false);
    };

    init();
  }, [router]);

  if (loading) {
    return (
      <div style={loadingScreen}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Loading Profile…
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={loadingScreen}>
        <p role="alert" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", maxWidth: 420, textAlign: "center", padding: 24 }}>
          {loadError}
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const roles = profile.active_roles ?? [];
  const provType = profile.provider_type;
  const isBroker = roles.includes("broker");
  const isPhotographer = roles.includes("provider") && provType === "photographer";
  const isResearcher = roles.includes("provider") && provType === "researcher";

  return (
    <div style={pageWrap}>
      <AtmosphereBackground variant="default" />
      <header style={navBar}>
        <Link href="/dashboard" style={backLink}>
          ← Dashboard
        </Link>
        <span style={navTitle}>Your Profile</span>
        {/* Public pages are addressed by the permanent id, so a name change
            never breaks the link. A private profile has no public page. */}
        {profile.is_profile_public === true ? (
          <Link href={`/profile/${encodeURIComponent(profile.id)}`} style={publicLink}>
            View public
          </Link>
        ) : (
          <span style={privateNote}>Private profile</span>
        )}
      </header>

      <main style={mainContent}>
        <ProfileBaseLayer
          profile={profile}
          isOwnView
          publicRoles={privacy?.public_roles ?? []}
        />

        {/* Only the panels other people can see. */}
        <div style={panelsGrid}>
          {isBroker && (
            <BrokerPanel
              data={brokerData}
              isPublic={false}
              prcVerified={!!profile?.prc_verified}
              prcLicense={profile?.prc_verified ? profile?.prc_license : ""}
            />
          )}
          {isPhotographer && (
            <PhotographerPanel
              projects={photographerProjects}
              userId={profile.id}
              isAvailable={profile.provider_availability}
              isOwnView
            />
          )}
          {isResearcher && (
            <ResearcherPanel
              data={researcherData}
              isAnonymous={privacy?.anonymous_byline ?? false}
            />
          )}
        </div>

        {/* A-135 — privacy has one home: Settings → Privacy. */}
        <Link href="/settings#privacy" style={privacyLink}>
          Privacy & anonymity settings →
        </Link>
      </main>
    </div>
  );
}

const privacyLink = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
  padding: "0 16px",
  border: "1px solid var(--border-solid)",
  borderRadius: 6,
  color: "var(--accent)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  textDecoration: "none",
  alignSelf: "flex-start",
};

const pageWrap = {
  minHeight: "100vh",
  background: "#0e0e0e",
  color: "#f0ede8",
  paddingBottom: 80,
  position: "relative",
};

const navBar = {
  position: "sticky",
  top: 0,
  zIndex: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 24px",
  background: "rgba(14,14,14,0.85)",
  backdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const backLink = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "var(--text-secondary)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  textDecoration: "none",
};

const navTitle = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "#E8AE3C",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const publicLink = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "#E8AE3C",
  textDecoration: "none",
  letterSpacing: "0.06em",
};

const privateNote = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "var(--text-secondary)",
  letterSpacing: "0.06em",
};

const mainContent = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
  position: "relative",
  zIndex: 1,
};

const panelsGrid = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const loadingScreen = {
  minHeight: "100vh",
  background: "#0e0e0e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
