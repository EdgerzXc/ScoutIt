import { Suspense } from "react";
import { loadPublicProviders } from "@/lib/profileClient";
import ResearchersClient from "./ResearchersClient";

export const dynamic = "force-dynamic";

async function loadInitialResearchers() {
  try {
    const { data, error } = await loadPublicProviders("researcher");
    if (error) {
      console.error("[/researchers] server Supabase load failed:", error);
      return [];
    }
    return (data || []).map((p) => ({
      name: p.display_name || "Unnamed Analyst",
      location: p.location || "",
      focus: p.service || "",
      headline: p.headline || "",
      bio: p.bio || "",
      image: p.avatar_url || "",
      isExample: !!p.is_example_account,
      available: p.provider_availability !== false,
    }));
  } catch (err) {
    console.error("[/researchers] server load exception:", err?.message);
    return [];
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
      <ResearchersClient initialResearchers={initialResearchers} />
    </Suspense>
  );
}
