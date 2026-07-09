"use client";

// /profile/[username] — PUBLIC VIEW
// Readable by anyone. Enforces privacy at every layer:
//   - Only renders if is_profile_public = true
//   - connects_balance NEVER queried (excluded at SELECT level in profileClient)
//   - Seeker and Owner panels NEVER rendered
//   - Only roles in public_roles array are shown

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProfileBaseLayer from "@/components/profile/ProfileBaseLayer";
import BrokerPanel from "@/components/profile/panels/BrokerPanel";
import PhotographerPanel from "@/components/profile/panels/PhotographerPanel";
import ResearcherPanel from "@/components/profile/panels/ResearcherPanel";
import {
  loadPublicProfile,
  loadPublicRoles,
  loadBrokerProfile,
  loadResearcherProfile,
  loadPhotographerProjects,
} from "@/lib/profileClient";

export default function PublicProfilePage() {
  const { username } = useParams();
  const displayName = username ? decodeURIComponent(username) : null;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [privacy, setPrivacy] = useState(null);
  const [brokerData, setBrokerData] = useState(null);
  const [researcherData, setResearcherData] = useState(null);
  const [photographerProjects, setPhotographerProjects] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!displayName) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const init = async () => {
      // loadPublicProfile explicitly excludes connects_balance at query level
      const { data: pub, error } = await loadPublicProfile(displayName);

      if (error || !pub) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(pub);

      // Which roles the person chose to display publicly. Fetched via a
      // server route — privacy_settings is own-rows-only under RLS, so the
      // anon client can't (and shouldn't) read the raw row of someone else.
      const { publicRoles: fetchedRoles } = await loadPublicRoles(pub.id);
      setPrivacy({ public_roles: fetchedRoles });

      const publicRoles = fetchedRoles;
      const roles = pub.active_roles ?? [];
      const provType = pub.provider_type;

      // Only load panel data for roles that are public AND in public_roles
      const showBroker      = roles.includes("broker")   && publicRoles.includes("broker");
      const showProvider    = roles.includes("provider")  && publicRoles.includes("provider");
      const showPhotographer = showProvider && provType === "photographer";
      const showResearcher   = showProvider && provType === "researcher";

      const [brokerResult, researcherResult, photoResult] = await Promise.all([
        showBroker        ? loadBrokerProfile(pub.id)           : Promise.resolve({ data: null }),
        showResearcher    ? loadResearcherProfile(pub.id)        : Promise.resolve({ data: null }),
        showPhotographer  ? loadPhotographerProjects(pub.id)     : Promise.resolve({ data: [] }),
      ]);

      setBrokerData(brokerResult.data);
      setResearcherData(researcherResult.data);
      setPhotographerProjects(photoResult.data ?? []);
      setLoading(false);
    };

    init();
  }, [displayName]);

  if (loading) {
    return (
      <div style={loadingScreen}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={notFoundScreen}>
        <header style={navBar}>
          <Link href="/" style={backLink}>← ScoutIt</Link>
        </header>
        <div style={notFoundContent}>
          <h1 style={notFoundTitle}>Profile Unavailable</h1>
          <p style={notFoundDesc}>
            This profile is private or does not exist.
          </p>
          <Link href="/discover" style={notFoundCta}>Explore Properties</Link>
        </div>
      </div>
    );
  }

  const roles = profile.active_roles ?? [];
  const provType = profile.provider_type;
  const publicRoles = privacy?.public_roles ?? [];

  // Resolve which panels to show — enforce Seeker and Owner never shown
  const showBroker      = roles.includes("broker")  && publicRoles.includes("broker");
  const showProvider    = roles.includes("provider") && publicRoles.includes("provider");
  const showPhotographer = showProvider && provType === "photographer";
  const showResearcher   = showProvider && provType === "researcher";
  // Seeker (buyer) — NEVER on public view, no condition needed
  // Owner — NEVER on public view, no condition needed

  const hasAnyPanel = showBroker || showPhotographer || showResearcher;

  return (
    <div style={pageWrap}>
      {/* Nav */}
      <header style={navBar}>
        <Link href="/" style={backLink}>← ScoutIt</Link>
      </header>

      <main style={mainContent}>
        {/* Base Layer — no connects_balance, no edit controls */}
        <ProfileBaseLayer
          profile={profile}
          isOwnView={false}
          publicRoles={publicRoles}
        />

        {/* Role Panels — only public roles */}
        {hasAnyPanel && (
          <div style={panelsGrid}>
            {showBroker && <BrokerPanel data={brokerData} isPublic />}
            {showPhotographer && (
              <PhotographerPanel
                projects={photographerProjects}
                userId={profile.id}
                isAvailable={profile.provider_availability}
                isOwnView={false}
              />
            )}
            {showResearcher && (
              <ResearcherPanel
                data={researcherData}
                isAnonymous={privacy?.anonymous_byline ?? false}
              />
            )}
          </div>
        )}

        {/* No panels to show */}
        {!hasAnyPanel && (
          <div style={emptyPanels}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", fontStyle: "italic" }}>
              No public activity to display.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

const pageWrap = {
  minHeight: "100vh",
  background: "#0e0e0e",
  color: "#f0ede8",
  paddingBottom: 80,
};

const navBar = {
  position: "sticky",
  top: 0,
  zIndex: 40,
  display: "flex",
  alignItems: "center",
  padding: "14px 24px",
  background: "rgba(14,14,14,0.85)",
  backdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const backLink = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "var(--text-secondary)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  textDecoration: "none",
};

const mainContent = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "40px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const panelsGrid = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const emptyPanels = {
  padding: "24px 0",
};

const loadingScreen = {
  minHeight: "100vh",
  background: "#0e0e0e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const notFoundScreen = {
  minHeight: "100vh",
  background: "#0e0e0e",
  color: "#f0ede8",
};

const notFoundContent = {
  maxWidth: 480,
  margin: "0 auto",
  padding: "80px 24px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
};

const notFoundTitle = {
  fontFamily: "Georgia, serif",
  fontSize: 36,
  color: "#f0ede8",
};

const notFoundDesc = {
  fontFamily: "var(--font-body)",
  fontSize: 15,
  color: "var(--text-secondary)",
  fontStyle: "italic",
};

const notFoundCta = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "#E8AE3C",
  border: "1px solid rgba(232, 174, 60,0.3)",
  borderRadius: 20,
  padding: "8px 20px",
  textDecoration: "none",
  marginTop: 8,
};
