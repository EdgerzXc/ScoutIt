import { Suspense } from "react";
import { loadPublicProviders } from "@/lib/profileClient";
import { activePilotParticipantIds } from "@/lib/pilotProvenance.server";
import PhotographersClient from "./PhotographersClient";
import { normalizeSupabaseProfessional } from "@/lib/professionalDirectory";
import { publicBadgeGrantsByUserId } from "@/lib/professionalProvenance.server";
import ProfessionalDirectorySkeleton from "@/components/professionals/ProfessionalDirectorySkeleton";

export const dynamic = "force-dynamic";

async function loadInitialPhotographers() {
  try {
    const { data, error } = await loadPublicProviders("photographer");
    if (error) {
      console.error("[/photographers] server Supabase load failed:", error);
      return { records: [], error: "The public photographer roster could not be loaded. Please try again shortly." };
    }
    const ids = (data || []).map((profile) => profile.id);
    const [pilotIds, badgeGrants] = await Promise.all([activePilotParticipantIds(ids), publicBadgeGrantsByUserId(ids)]);
    return { records: (data || []).map((p) => normalizeSupabaseProfessional({ ...p, badges: badgeGrants.get(p.id) || [], is_pilot_participant: pilotIds.has(p.id) }, "photographer")).filter(Boolean), error: "" };
  } catch (err) {
    console.error("[/photographers] server load exception:", err?.message);
    return { records: [], error: "The public photographer roster could not be loaded. Please try again shortly." };
  }
}

export default async function PhotographersRootPage() {
  const initialPhotographers = await loadInitialPhotographers();

  return (
    <Suspense fallback={<ProfessionalDirectorySkeleton category="photographer" />}>
      <PhotographersClient initialRecords={initialPhotographers.records} initialError={initialPhotographers.error} />
    </Suspense>
  );
}
