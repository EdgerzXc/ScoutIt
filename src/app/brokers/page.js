import { Suspense } from "react";
import { getCmsBundle } from "@/lib/cmsCache";
import { stripPremiumFields } from "@/lib/premiumFields";
import BrokersClient from "./BrokersClient";

export const dynamic = "force-dynamic";

async function loadInitialBrokers() {
  try {
    const bundle = await getCmsBundle();
    return (bundle?.brokers || []).map((b) => stripPremiumFields(b, "starry"));
  } catch (err) {
    console.error("[/brokers] server CMS load failed:", err?.message);
    return [];
  }
}

export default async function BrokersRootPage() {
  const initialBrokers = await loadInitialBrokers();

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
      <BrokersClient initialBrokers={initialBrokers} />
    </Suspense>
  );
}
