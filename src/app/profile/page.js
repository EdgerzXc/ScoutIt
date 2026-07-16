"use client";

// /profile — OWN VIEW
// Authenticated users only. Redirects to /onboarding if no session.
// Shows all active role panels, connects balance, and privacy controls.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProfileBaseLayer from "@/components/profile/ProfileBaseLayer";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import PrivacyControls from "@/components/profile/PrivacyControls";
import BrokerPanel from "@/components/profile/panels/BrokerPanel";
import PhotographerPanel from "@/components/profile/panels/PhotographerPanel";
import ResearcherPanel from "@/components/profile/panels/ResearcherPanel";
import SeekerPanel from "@/components/profile/panels/SeekerPanel";
import OwnerPanel from "@/components/profile/panels/OwnerPanel";
import {
  upsertProfile,
  loadPrivacySettings,
  loadBrokerProfile,
  loadResearcherProfile,
  loadPhotographerProjects,
  loadSeekerSavedCount,
  loadOwnerListings,
  loadOwnerInquiryCount,
} from "@/lib/profileClient";

export default function OwnProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [privacy, setPrivacy] = useState(null);
  const [brokerData, setBrokerData] = useState(null);
  const [researcherData, setResearcherData] = useState(null);
  const [photographerProjects, setPhotographerProjects] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [ownerListings, setOwnerListings] = useState([]);
  const [ownerInquiries, setOwnerInquiries] = useState(0);

  useEffect(() => {
    const init = async () => {
      const raw = localStorage.getItem("scoutit_user");
      if (!raw) {
        router.push("/onboarding");
        return;
      }

      let localUser;
      try {
        localUser = JSON.parse(raw);
      } catch {
        router.push("/onboarding");
        return;
      }

      // Sync localStorage → Supabase and get back the canonical profile
      const { data: syncedProfile } = await upsertProfile(localUser);
      const activeProfile = syncedProfile ?? {
        id: localUser.id,
        display_name: localUser.name,
        subscription_tier: localUser.tier || "starry",
        connects_balance: localUser.connects_balance ?? 0,
        active_roles: localUser.tags || [],
        provider_type: localUser.providerType || null,
        location: localUser.publicProfile?.location || null,
        headline: localUser.publicProfile?.headline || null,
        bio: localUser.publicProfile?.bio || null,
        firm: localUser.publicProfile?.firm || null,
        member_since: localUser.created_at || new Date().toISOString(),
        is_profile_public: false,
        provider_availability: localUser.provider?.availability ?? true,
      };
      setProfile(activeProfile);

      const roles = activeProfile.active_roles || [];
      const provType = activeProfile.provider_type;
      const userId = activeProfile.id;

      // Load all panel data in parallel
      const [
        privacyResult,
        brokerResult,
        researcherResult,
        photoProjResult,
        savedResult,
        ownerListResult,
      ] = await Promise.all([
        loadPrivacySettings(userId),
        roles.includes("broker") ? loadBrokerProfile(userId) : Promise.resolve({ data: null }),
        roles.includes("provider") && provType === "researcher"
          ? loadResearcherProfile(userId)
          : Promise.resolve({ data: null }),
        roles.includes("provider") && provType === "photographer"
          ? loadPhotographerProjects(userId)
          : Promise.resolve({ data: [] }),
        roles.includes("buyer") ? loadSeekerSavedCount(userId) : Promise.resolve({ count: 0 }),
        roles.includes("owner") ? loadOwnerListings(userId) : Promise.resolve({ data: [] }),
      ]);

      setPrivacy(privacyResult.data);
      setBrokerData(brokerResult.data);
      setResearcherData(researcherResult.data);
      setPhotographerProjects(photoProjResult.data ?? []);
      setSavedCount(savedResult.count ?? 0);

      const listings = ownerListResult.data ?? [];
      setOwnerListings(listings);
      if (listings.length > 0) {
        const { count } = await loadOwnerInquiryCount(listings.map((l) => l.id));
        setOwnerInquiries(count ?? 0);
      }

      setLoading(false);
    };

    init();
  }, [router]);

  const handlePrivacyUpdate = ({ isProfilePublic, privacy: nextPrivacy } = {}) => {
    if (isProfilePublic !== undefined) {
      setProfile((p) => ({ ...p, is_profile_public: isProfilePublic }));
    }
    if (nextPrivacy !== undefined) {
      setPrivacy((p) => ({ ...p, ...nextPrivacy }));
    }
  };

  if (loading) {
    return (
      <div style={loadingScreen}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Loading Profile…
        </span>
      </div>
    );
  }

  if (!profile) return null;

  const roles = profile.active_roles ?? [];
  const provType = profile.provider_type;
  const isBroker = roles.includes("broker");
  const isPhotographer = roles.includes("provider") && provType === "photographer";
  const isResearcher = roles.includes("provider") && provType === "researcher";
  const isBuyer = roles.includes("buyer");
  const isOwner = roles.includes("owner");

  return (
    <div style={pageWrap}>
      <AtmosphereBackground variant="default" />
      {/* Nav */}
      <header style={navBar}>
        <Link href="/dashboard" style={backLink}>
          ← Dashboard
        </Link>
        <span style={navTitle}>Profile</span>
        <Link href={`/profile/${encodeURIComponent(profile.display_name || "")}`} style={publicLink}>
          View Public
        </Link>
      </header>

      <main style={mainContent}>
        {/* Base Layer */}
        <ProfileBaseLayer
          profile={profile}
          isOwnView
          publicRoles={privacy?.public_roles ?? []}
        />

        {/* Role Panels */}
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

          {/* PRIVATE PANELS — own view only, never on public */}
          {isBuyer && (
            <SeekerPanel
              savedCount={savedCount}
              isAnonymous={privacy?.anonymous_browsing ?? false}
            />
          )}
          {isOwner && (
            <OwnerPanel listings={ownerListings} inquiryCount={ownerInquiries} />
          )}
        </div>

        {/* Privacy Controls */}
        <PrivacyControls
          userId={profile.id}
          username={encodeURIComponent(profile.display_name || "")}
          isProfilePublic={profile.is_profile_public}
          privacy={privacy}
          activeRoles={roles}
          providerType={provType}
          onUpdate={handlePrivacyUpdate}
        />
      </main>
    </div>
  );
}

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
  fontSize: 11,
  color: "var(--text-secondary)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  textDecoration: "none",
};

const navTitle = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  color: "#E8AE3C",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
};

const publicLink = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  color: "#E8AE3C",
  textDecoration: "none",
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
