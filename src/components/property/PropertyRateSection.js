import Link from "next/link";
import dynamic from "next/dynamic";
import GlassPanel from "@/components/ui/GlassPanel";
import { formatUnitPrice } from "@/lib/unitMasterPage";
import AffordabilityCalculator from "@/components/property/AffordabilityCalculator";

const MonthlyCostCalculator = dynamic(() => import("@/components/property/MonthlyCostCalculator"), { ssr: false });

export default function PropertyRateSection({
  d,
  slug,
  rosterLoaded,
  rosterUnavailable,
  propertyRoster,
  rosterUploader,
  isCommercial = false,
}) {
  const hasPrice = d.listed_price && d.listed_price.trim().toUpperCase() !== "N/A";
  const isPublished = (d.price_status || "").toLowerCase().includes("publish");
  const verifiedBy = (d.price_verified_by || "").trim();
  const isVerified = verifiedBy && verifiedBy.toLowerCase() !== "unverified";

  // Commercial gates price on published & verified status; Residential displays indicated price if provided
  const showPrice = isCommercial
    ? hasPrice && isPublished && isVerified
    : hasPrice;

  return (
    <>
      <div style={{ height: "1px", background: "var(--border)", margin: "28px 0 24px" }} />
      {showPrice ? (
        <GlassPanel className="p-6 rounded-md">
          <div style={{ fontFamily: "var(--font-body)", fontSize: "clamp(30px,4.2vw,44px)", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.1 }}>
            {formatUnitPrice(d.listed_price)}
          </div>
          {isCommercial ? (
            <>
              {/* Verified-by badge — the confirmation the buyer can trust */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", marginTop: "14px", padding: "6px 12px", border: "0.5px solid color-mix(in srgb, var(--green) 40%, transparent)", borderRadius: "4px", background: "color-mix(in srgb, var(--green) 6%, transparent)" }}>
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.5L6 11l5.5-7" /></svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--green)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Verified by {verifiedBy}</span>
              </div>
              {d.price_source && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--text-muted)", marginTop: "12px" }}>
                  Source: {d.price_source}
                </div>
              )}
              {d.price_notes && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.75, marginTop: "10px" }}>{d.price_notes}</div>
              )}
              <p style={{ fontFamily: "system-ui,-apple-system,sans-serif", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7, marginTop: "16px" }}>
                Price is provided and confirmed by the listing&apos;s authorized owner, property manager, or broker. ScoutIt displays it as confirmed by that party. For inquiries, speak directly with an authorized representative.
              </p>
            </>
          ) : (
            <>
              {d.price_source && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--text-muted)", marginTop: "10px" }}>
                  Price indicated by {d.price_source}
                </div>
              )}
              {d.price_notes && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.75, marginTop: "10px" }}>{d.price_notes}</div>
              )}
              <p style={{ fontFamily: "system-ui,-apple-system,sans-serif", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7, marginTop: "16px" }}>
                Price estimates are provided solely by authorized sellers, owners, or licensed property managers. ScoutIt does not set, verify, or guarantee any stated price. For inquiries, speak directly with an authorized representative.
              </p>
            </>
          )}
        </GlassPanel>
      ) : (
        <GlassPanel className="p-6 rounded-md">
          <div style={{ fontFamily: "var(--font-body)", fontSize: "clamp(20px,2.6vw,26px)", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.2 }}>
            Price on request
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, margin: "10px 0 16px", maxWidth: "480px" }}>
            No confirmed rate has been published for this space. Inquire with the owner, property manager, or broker for current pricing.
          </p>
          {slug ? (
            <Link href={`/property/${slug}/brokers`} style={{ display: "inline-block", fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--accent)", textDecoration: "none", letterSpacing: "0.01em" }}>
              Inquire with an authorized broker →
            </Link>
          ) : null}
        </GlassPanel>
      )}

      {!isCommercial && (
        <AffordabilityCalculator
          listedPrice={d.listed_price}
          priceStatus={d.price_status}
          tenure={d.tenure}
        />
      )}

      <MonthlyCostCalculator d={d} />

      <div style={{ height: "1px", background: "var(--border)", margin: "28px 0 24px" }} />

      {rosterLoaded && (
        <div style={{ marginTop: "0", padding: "16px", border: "1px solid var(--accent-muted)", borderRadius: "4px", background: "rgba(var(--accent-rgb),0.03)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>Current Property Representation</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--on-surface)" }}>{rosterUnavailable ? "Representation status unavailable" : propertyRoster?.length > 0 ? `${propertyRoster.length} active authorized broker${propertyRoster.length === 1 ? "" : "s"}` : "Unrepresented // uploader or lister route"}</div>
          {rosterLoaded && !rosterUnavailable && propertyRoster?.length === 0 && rosterUploader ? (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "8px" }}>Listed by {rosterUploader}</div>
          ) : null}
          {slug ? (
            <Link href={`/property/${slug}/brokers`} style={{ display: "inline-block", marginTop: "10px", color: "var(--accent-bright)", fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>View current roster →</Link>
          ) : null}
        </div>
      )}
    </>
  );
}
