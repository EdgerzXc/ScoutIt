import { Suspense } from "react";
import { loadPublicProviders } from "@/lib/profileClient";
import { activePilotParticipantIds } from "@/lib/pilotProvenance.server";
import EventPlannersClient from "./EventPlannersClient";
import { normalizeSupabaseProfessional } from "@/lib/professionalDirectory";
import { publicBadgeGrantsByUserId } from "@/lib/professionalProvenance.server";
import ProfessionalDirectorySkeleton from "@/components/professionals/ProfessionalDirectorySkeleton";

export const dynamic = "force-dynamic";

async function loadInitialPlanners() {
  try {
    const { data, error } = await loadPublicProviders("event_planner");
    if (error) {
      console.error("[/event-planners] server Supabase load failed:", error);
      return { records: [], error: "The public event-professional roster could not be loaded. Please try again shortly." };
    }
    const ids = (data || []).map((profile) => profile.id);
    const [pilotIds, badgeGrants] = await Promise.all([activePilotParticipantIds(ids), publicBadgeGrantsByUserId(ids)]);
    return { records: (data || []).map((p) => normalizeSupabaseProfessional({ ...p, badges: badgeGrants.get(p.id) || [], is_pilot_participant: pilotIds.has(p.id) }, "event_planner")).filter(Boolean), error: "" };
  } catch (err) {
    console.error("[/event-planners] server load exception:", err?.message);
    return { records: [], error: "The public event-professional roster could not be loaded. Please try again shortly." };
  }
}

export default async function EventPlannersRootPage() {
  const initialPlanners = await loadInitialPlanners();

  return (
    <Suspense fallback={<ProfessionalDirectorySkeleton category="event_planner" />}>
      <EventPlannersClient initialRecords={initialPlanners.records} initialError={initialPlanners.error} />
    </Suspense>
  );
}
