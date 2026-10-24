import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function resolveClaimDraftByToken(token) {
  if (!token || !supabaseAdmin) return null;
  try {
    const { data: matchedByDetails } = await supabaseAdmin
      .from("properties")
      .select("id, title, location, slug, canonical_slug, owner_id, verified, details")
      .contains("details", { claim_token: token })
      .limit(1)
      .maybeSingle();

    if (matchedByDetails) return matchedByDetails;

    const { data: prospect } = await supabaseAdmin
      .from("outreach_prospects")
      .select("id, property_name, property_address, district_city")
      .eq("claim_token", token)
      .limit(1)
      .maybeSingle();

    if (prospect) {
      return {
        id: prospect.id,
        title: prospect.property_name,
        location: [prospect.property_address, prospect.district_city].filter(Boolean).join(", "),
        verified: false,
        details: { claim_token: token, source_type: "staff_outreach" },
      };
    }
  } catch {
    // Graceful fallback when tables are unmigrated in preview
  }
  return null;
}

export default async function ClaimPropertyTokenPage({ params }) {
  const resolvedParams = await params;
  const token = String(resolvedParams?.token || "").trim();
  const draftProperty = await resolveClaimDraftByToken(token);

  return (
    <main
      className="min-h-dvh flex items-center justify-center px-4 py-16"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div
        className="w-full max-w-xl rounded-2xl p-8 backdrop-blur-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--accent-muted)",
        }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-3"
          style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
        >
          ScoutIt Owner Sovereignty · Claim Invitation
        </p>

        {draftProperty ? (
          <>
            <h1 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              {draftProperty.title}
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {draftProperty.location || "Metro Manila"}
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
              This property has been prepared as a claimable Space Intelligence draft. Sign in or
              open your Owner Dashboard to verify authority and take full control of your listing,
              direct inquiries, and broker representations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/inventory?claim=${encodeURIComponent(draftProperty.id)}&token=${encodeURIComponent(token)}`}
                className="px-5 py-3 rounded-lg text-xs uppercase tracking-widest font-semibold"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "var(--accent-bright)",
                  color: "var(--bg)",
                }}
              >
                Verify &amp; Claim Property
              </Link>
              <Link
                href="/property"
                className="px-5 py-3 rounded-lg text-xs uppercase tracking-widest"
                style={{
                  fontFamily: "var(--font-mono)",
                  border: "1px solid var(--accent-muted)",
                  color: "var(--text-primary)",
                }}
              >
                Explore Directory
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Claim Invitation Verification
            </h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
              We couldn&apos;t find an active draft matching token{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                {token || "unknown"}
              </code>
              , or this listing has already been claimed by its verified owner.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-3 rounded-lg text-xs uppercase tracking-widest font-semibold"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "var(--accent-bright)",
                  color: "var(--bg)",
                }}
              >
                Open Owner Dashboard
              </Link>
              <Link
                href="/property"
                className="px-5 py-3 rounded-lg text-xs uppercase tracking-widest"
                style={{
                  fontFamily: "var(--font-mono)",
                  border: "1px solid var(--accent-muted)",
                  color: "var(--text-primary)",
                }}
              >
                Browse Directory
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
