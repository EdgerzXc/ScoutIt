import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

describe("Wave 5 Pillar 1: End-to-End UI Wiring, In-Flight Locks, Error Surfaces & A11y/Design Contracts", () => {
  it("1. DashboardContext guards publishListing and closeListing with per-listing useRef locks and preserves creationSource", () => {
    const src = read("src/context/DashboardContext.js");
    expect(src).toContain("publishingIdsRef = useRef(new Set())");
    expect(src).toContain("closingIdsRef = useRef(new Set())");
    expect(src).toContain("closingIdsRef.current.has(listingId)");
    expect(src).toContain("closingIdsRef.current.delete(listingId)");
    expect(src).toContain("publishingIdsRef.current.has(listingId)");
    expect(src).toContain("publishingIdsRef.current.delete(listingId)");
    expect(src).toContain("creation_source: listing.creationSource || 'manual'");
  });

  it("2. OwnerMode locks Send Handshake, Publish/Off-Market, Deal Accept/Decline, and surfaces Spatial/Note errors", () => {
    const src = read("src/components/dashboard/OwnerMode.js");
    expect(src).toContain("const [isInviting, setIsInviting] = useState(false)");
    expect(src).toContain("const inviteLockRef = useRef(false)");
    expect(src).toContain("disabled={isInviting || !inviteName.trim() || connects < 1}");
    expect(src).toContain("const [busyListingId, setBusyListingId] = useState(null)");
    expect(src).toContain("const busyListingRef = useRef(null)");
    expect(src).toContain("disabled={busyListingId === activeListing.id}");
    expect(src).toContain("const [busyDealId, setBusyDealId] = useState(null)");
    expect(src).toContain("const busyDealRef = useRef(null)");
    expect(src).toContain("disabled={busyDealId === pitch.id}");
    expect(src).not.toMatch(/\/api\/spatial\/request[\s\S]*?\.catch\(\(\)\s*=>\s*\{\}\)/);
    expect(src).toContain("if (!spatialRes.ok)");
    expect(src).toContain('throw new Error(spatialData.error || "Spatial Twin request failed")');
    expect(src).toContain("if (!res.ok)");
    expect(src).toContain("addToast(\"Failed to save deal note. Please try again.\"");
  });

  it("3. BrokerMode awaits updatePitchStatus with busyDealId guard, only closes on ok === true, and surfaces note errors", () => {
    const src = read("src/components/dashboard/BrokerMode.js");
    expect(src).toContain("const [busyDealId, setBusyDealId] = useState(null)");
    expect(src).toContain("const busyDealRef = useRef(null)");
    expect(src).toContain("const ok = await updatePitchStatus(deal.id, 'declined')");
    expect(src).toContain("if (ok === true) setActiveDealId(null)");
    expect(src).toContain("disabled={busyDealId === deal.id}");
    expect(src).toContain("if (!res.ok)");
    expect(src).toContain('throw new Error("Failed to save private note")');
  });

  it("4. DealFileSlideOver surfaces actionError on transcript export and note save failures", () => {
    const src = read("src/components/dashboard/crm/DealFileSlideOver.js");
    expect(src).toContain("const [actionError, setActionError] = useState(null)");
    expect(src).toContain('setActionError("Could not export transcript. Please try again.")');
    expect(src).toContain('setActionError("Failed to save private notes. Please check your connection.")');
    expect(src).toContain('role="alert"');
  });

  it("5. LiveEditorWorkspace marks PDF-assisted drafts with creationSource: 'pdf_assisted' and forwards it", () => {
    const src = read("src/components/dashboard/LiveEditorWorkspace.js");
    expect(src).toContain('creationSource: "pdf_assisted"');
    expect(src).toContain('creationSource: formData.creationSource || "manual"');
  });

  it("6. DeepIntelligenceStudio renders proper select/checkbox/textarea inputs, marks pdf_assisted, and forwards full payload", () => {
    const src = read("src/components/dashboard/DeepIntelligenceStudio.js");
    expect(src).toContain('field.type === "select"');
    expect(src).toContain("<select");
    expect(src).toContain('field.type === "checkbox"');
    expect(src).toContain("e.target.checked");
    expect(src).toContain('field.key === "DI_Hist_Tx" || field.type === "textarea"');
    expect(src).toContain("<textarea");
    expect(src).toContain('creationSource: "pdf_assisted"');
    expect(src).toContain("type: formData.category");
    expect(src).toContain("completenessScore: completionStats.percentage");
    expect(src).toContain('creationSource: formData.creationSource || "manual"');
  });

  it("7. QuotaSwapModal & SpatialStudioRequestModal use 90dvh and CSS design tokens", () => {
    const quota = read("src/components/dashboard/QuotaSwapModal.js");
    const spatial = read("src/components/dashboard/SpatialStudioRequestModal.js");
    expect(quota).toContain("max-h-[90dvh]");
    expect(quota).not.toContain("max-h-[90vh]");
    expect(quota).toContain("from-[var(--bg-surface)] to-[var(--bg-void)]");
    expect(quota).toContain("rgba(var(--accent-rgb),0.35)");
    expect(spatial).toContain("max-h-[90dvh]");
    expect(spatial).not.toContain("max-h-[90vh]");
  });

  it("8. PromoteModal wraps clipboard writeText in try/catch with inline fallback message", () => {
    const src = read("src/components/property/PromoteModal.js");
    expect(src).toContain("await navigator.clipboard.writeText(text)");
    expect(src).toContain("setCopyError(true)");
    expect(src).toContain("Clipboard access unavailable");
    expect(src).not.toContain("transition-all");
  });

  it("9. UnitMasterPage & wishlist check !res.ok on /api/cms and render outage/retry UI", () => {
    const unit = read("src/components/property/UnitMasterPage.js");
    const wishlist = read("src/app/wishlist/page.js");
    expect(unit).toContain("const [loadError, setLoadError] = useState(false)");
    expect(unit).toContain("if (!res.ok)");
    expect(unit).toContain("Unable to reach the property directory.");
    expect(wishlist).toContain("const [cmsError, setCmsError] = useState(false)");
    expect(wishlist).toContain("if (!res.ok) throw new Error");
    expect(wishlist).toContain("Live listing status is temporarily unavailable");
    expect(wishlist).not.toContain("min-height: 100vh;");
    expect(wishlist).toContain("min-height: 100dvh;");
  });

  it("10. Mission Control UI enforces error surfaces, clipboard try/catch, 44px close buttons, named transitions, and 100dvh", () => {
    const outreach = read("mission-control/src/app/dashboard/outreach/OutreachClient.js");
    expect(outreach).toContain("const [actionError, setActionError] = useState(null)");
    expect(outreach).toContain("await navigator.clipboard.writeText(textToCopy)");
    expect(outreach).not.toContain("transition-all");

    const brokers = read("mission-control/src/app/dashboard/brokers/BrokersClient.js");
    expect(brokers).toContain('res?.error || "Failed to update broker status."');
    expect(brokers).toContain('aria-label="Close dialog"');
    expect(brokers).toContain("min-h-[44px] min-w-[44px]");

    const privacy = read("mission-control/src/app/dashboard/privacy/PrivacyClient.js");
    expect(privacy).toContain('res?.error || "Failed to update request."');
    expect(privacy).toContain('aria-label="Close dialog"');
    expect(privacy).toContain("min-h-[44px] min-w-[44px]");

    for (const modalPath of [
      "mission-control/src/app/dashboard/articles/ArticleEditorModal.js",
      "mission-control/src/app/dashboard/reviews/ReviewsClient.js",
      "mission-control/src/components/communications/StaffReplyModal.js",
    ]) {
      const modalSrc = read(modalPath);
      expect(modalSrc).toContain('aria-label="Close dialog"');
      expect(modalSrc).toContain("min-h-[44px] min-w-[44px]");
      expect(modalSrc).toContain('type="button"');
    }

    const mfa = read("mission-control/src/app/dashboard/mfa/MfaClient.js");
    expect(mfa).toContain("await navigator.clipboard.writeText(secret)");
    expect(mfa).toContain("Clipboard access unavailable");

    const osint = read("mission-control/src/components/osint/OSINTControlCenter.js");
    expect(osint).toContain("await navigator.clipboard.writeText(generatedPrompt)");
    expect(osint).toContain("Clipboard access unavailable");
    expect(osint).not.toContain("transition-all");

    const globals = read("mission-control/src/app/globals.css");
    expect(globals).toContain("min-height: 100dvh;");
    expect(globals).not.toContain("min-height: 100vh;");
  });
});
