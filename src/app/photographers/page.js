import { Suspense } from "react";
import { loadPublicProviders } from "@/lib/profileClient";
import { activePilotParticipantIds } from "@/lib/pilotProvenance.server";
import PhotographersClient from "./PhotographersClient";

export const dynamic = "force-dynamic";

async function loadInitialPhotographers() {
  try {
    const { data, error } = await loadPublicProviders("photographer");
    if (error) {
      console.error("[/photographers] server Supabase load failed:", error);
      return [];
    }
    const pilotIds = await activePilotParticipantIds((data || []).map((profile) => profile.id));
    return (data || []).map((p) => ({
      name: p.display_name || "Unnamed Photographer",
      location: p.location || "",
      specialty: p.service || "",
      headline: p.headline || "",
      bio: p.bio || "",
      image: p.avatar_url || "",
      isExample: !!p.is_example_account,
      isPilot: pilotIds.has(p.id),
      available: p.provider_availability !== false,
    }));
  } catch (err) {
    console.error("[/photographers] server load exception:", err?.message);
    return [];
  }
}

export default async function PhotographersRootPage() {
  const initialPhotographers = await loadInitialPhotographers();

  return (
    <Suspense
      fallback={
        <div
          className="directory-layout"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100dvh",
          }}
        >
          <h3 style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
            SCANNING THE ROSTER…
          </h3>
        </div>
      }
    >
      <PhotographersClient initialPhotographers={initialPhotographers} />
    </Suspense>
  );
}
