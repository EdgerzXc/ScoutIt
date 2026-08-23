import { Suspense } from "react";
import { loadPublicProviders } from "@/lib/profileClient";
import { activePilotParticipantIds } from "@/lib/pilotProvenance.server";
import ResearchersClient from "./ResearchersClient";
import { normalizeSupabaseProfessional } from "@/lib/professionalDirectory";
import { publicBadgeGrantsByUserId } from "@/lib/professionalProvenance.server";

export const dynamic = "force-dynamic";

async function loadInitialResearchers() {
  try {
    const { data, error } = await loadPublicProviders("researcher");
    if (error) {
      console.error("[/researchers] server Supabase load failed:", error);
      return { records: [], error: "The public researcher roster could not be loaded. Please try again shortly." };
    }
    const ids = (data || []).map((profile) => profile.id);
    const [pilotIds, badgeGrants] = await Promise.all([activePilotParticipantIds(ids), publicBadgeGrantsByUserId(ids)]);
    return { records: (data || []).map((p) => normalizeSupabaseProfessional({ ...p, badges: badgeGrants.get(p.id) || [], is_pilot_participant: pilotIds.has(p.id) }, "researcher")).filter(Boolean), error: "" };
  } catch (err) {
    console.error("[/researchers] server load exception:", err?.message);
    return { records: [], error: "The public researcher roster could not be loaded. Please try again shortly." };
  }
}

export default async function ResearchersRootPage() {
  const initialResearchers = await loadInitialResearchers();

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
      <ResearchersClient initialRecords={initialResearchers.records} initialError={initialResearchers.error} />
    </Suspense>
  );
}
