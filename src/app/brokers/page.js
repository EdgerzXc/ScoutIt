import { Suspense } from "react";
import { getCmsBundle } from "@/lib/cmsCache";
import { stripPremiumFields } from "@/lib/premiumFields";
import BrokersClient from "./BrokersClient";
import { normalizeAirtableBroker } from "@/lib/professionalDirectory";
import ProfessionalDirectorySkeleton from "@/components/professionals/ProfessionalDirectorySkeleton";

export const dynamic = "force-dynamic";

async function loadInitialBrokers() {
  try {
    const bundle = await getCmsBundle();
    return { records: (bundle?.brokers || []).map((b) => stripPremiumFields(b, "starry")).map(normalizeAirtableBroker).filter(Boolean), error: "" };
  } catch (err) {
    console.error("[/brokers] server CMS load failed:", err?.message);
    return { records: [], error: "The public advisor roster could not be loaded. Please try again shortly." };
  }
}

export default async function BrokersRootPage() {
  const initialBrokers = await loadInitialBrokers();

  return (
    <Suspense fallback={<ProfessionalDirectorySkeleton category="broker" />}>
      <BrokersClient initialRecords={initialBrokers.records} initialError={initialBrokers.error} />
    </Suspense>
  );
}
