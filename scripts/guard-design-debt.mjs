// A-098 — design-debt guardrails: no sweeps on locked surfaces.
//
// The audit measured wide drift (raw `#e8ae3c`, emoji iconography,
// `transition: all`, high z-indexes) but the fix policy is opportunistic:
// convert on touch only, never a sweep — and never the locked surfaces.
// What this guard enforces is that the drift STOPS GROWING: any file outside
// the frozen baseline that newly contains a raw accent hex or emoji fails
// the build. An exemption is a baseline edit in the same diff, which is the
// review signal — invisible drift is what this prevents.
//
// Counting note: the audit counted occurrences (297 raw hex hits); this
// guard counts FILES (57). Same drift, different unit. The frozen lists
// below were measured 2026-09-09 by stripping comments (not strings — a
// toast glyph in a string literal still counts, deliberately: a new file
// should reach for the icon system first and justify the exception).
//
// Scope is the main site (`src/`). Mission Control has its own surface
// rules. Test files are excluded — several assert over these very strings.

import fs from "node:fs";
import path from "node:path";

export const RAW_ACCENT_HEX = /#e8ae3c/i;
// Pictographic ranges plus common icon-ish symbols (stars, warning,
// geometric shapes, variation selector). Deliberately broad: the baseline
// grandfathers everything existing, so breadth only affects NEW files.
export const EMOJI_RE = /[🌀-🫿☀-➿⬀-⯿️]/u;
export const IMG_WITHOUT_ALT_RE = /<img(?![^>]*\balt=)[^>]*>/s;

export function stripCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
    .join("\n");
}

export function listSrcJs(root) {
  const src = path.join(root, "src");
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        full.endsWith(".js") &&
        !full.includes("__tests__") &&
        !full.endsWith(".test.js")
      ) {
        out.push(full);
      }
    }
  };
  walk(src);
  return out;
}

const rel = (root, full) => path.relative(root, full).replaceAll("\\", "/");

export function filesWithRawAccentHex(root = process.cwd()) {
  return listSrcJs(root)
    .filter((f) => RAW_ACCENT_HEX.test(stripCode(fs.readFileSync(f, "utf8"))))
    .map((f) => rel(root, f))
    .sort();
}

export function filesWithEmoji(root = process.cwd()) {
  return listSrcJs(root)
    .filter((f) => EMOJI_RE.test(stripCode(fs.readFileSync(f, "utf8"))))
    .map((f) => rel(root, f))
    .sort();
}

export function filesWithImgMissingAlt(root = process.cwd()) {
  return listSrcJs(root)
    .filter((f) => IMG_WITHOUT_ALT_RE.test(stripCode(fs.readFileSync(f, "utf8"))))
    .map((f) => rel(root, f))
    .sort();
}

// Frozen 2026-09-09. Grandfathered, convert-on-touch only
// (`#e8ae3c` → `var(--accent)` first). Locked surfaces stay untouched.
export const BASELINE_HEX_FILES = Object.freeze([
  "src/app/admin/page.js",
  "src/app/api/og/route.js",
  "src/app/badges/page.js",
  "src/app/descent/page.js",
  "src/app/error.js",
  "src/app/global-error.js",
  "src/app/intel/page.js",
  "src/app/opengraph-image.js",
  "src/app/page.js",
  "src/app/profile/page.js",
  "src/app/profile/[username]/page.js",
  "src/app/property/DirectoryClient.js",
  "src/app/twitter-image.js",
  "src/app/wishlist/page.js",
  "src/components/admin/FeatureConsolePanel.js",
  "src/components/admin/PropertyVerifyPanel.js",
  "src/components/board/ShowcaseStage.js",
  "src/components/chat/MockupChatbox.js",
  "src/components/connection/ConnectionPortal.js",
  "src/components/dashboard/BrokerMode.js",
  "src/components/dashboard/BuyerMode.js",
  "src/components/dashboard/MissionControlMode.js",
  "src/components/dashboard/PropertySectionEditor.js",
  "src/components/descent/GoldenHorizonCanvas.js",
  "src/components/descent/InteractivePanel.js",
  "src/components/flow/MasterFlowGraph.js",
  "src/components/intel/ActiveDetourHud.js",
  "src/components/intel/FulfilmentTerminal.js",
  "src/components/intel/IntelDoorCard.js",
  "src/components/intel/OSINTFlashTicker.js",
  "src/components/intel/SpatialIntelMap.js",
  "src/components/layout/Footer.js",
  "src/components/maps/lenses/location.js",
  "src/components/maps/lenses/transit.js",
  "src/components/maps/SpatialCanvas.js",
  "src/components/profile/panels/OwnerPanel.js",
  "src/components/profile/panels/PhotographerPanel.js",
  "src/components/profile/panels/ResearcherPanel.js",
  "src/components/profile/panels/SeekerPanel.js",
  "src/components/property/AffordabilityCalculator.js",
  "src/components/property/AttachedFindingCard.js",
  "src/components/property/ClaimPropertyPanel.js",
  "src/components/property/ComparisonMatrix.js",
  "src/components/property/FloodHeatmapMap.js",
  "src/components/property/InteractiveMap.js",
  "src/components/property/InteractiveRadiusMap.js",
  "src/components/property/MarketChapter.js",
  "src/components/property/MonthlyCostCalculator.js",
  "src/components/property/PropertyFAQSection.js",
  "src/components/property/WhereToSection.js",
  "src/components/transit/ManilaTransitMap.js",
  "src/components/ui/EarlyAccessGate.js",
  "src/components/ui/FloatingToolbox.js",
  "src/components/ui/ReactionButtons.js",
  "src/lib/BadgeEngine.js",
  "src/lib/email.js",
  "src/lib/freshness.js",
]);

export const BASELINE_EMOJI_FILES = Object.freeze([
  "src/app/api/cron/check-stale-listings/route.js",
  "src/app/api/cron/sweep-pending-requests/route.js",
  "src/app/api/dashboard/units/delegate/route.js",
  "src/app/api/dashboard/units/route.js",
  "src/app/api/dashboard/update/route.js",
  "src/app/api/deals/initiate/route.js",
  "src/app/api/deals/pitch/route.js",
  "src/app/api/faqs/review/route.js",
  "src/app/api/faqs/route.js",
  "src/app/api/notifications/route.js",
  "src/app/api/viewing-appointments/route.js",
  "src/app/badges/page.js",
  "src/app/dashboard/inventory/[id]/page.js",
  "src/app/dashboard/page.js",
  "src/app/intel/page.js",
  "src/app/intel/[article-slug]/page.js",
  "src/app/opengraph-image.js",
  "src/app/property/DirectoryClient.js",
  "src/app/property/[id]/brokers/BrokersClient.js",
  "src/app/researchers/[researcher-slug]/page.js",
  "src/app/settings/page.js",
  "src/app/twitter-image.js",
  "src/app/wishlist/page.js",
  "src/components/admin/ConnectsRefundPanel.js",
  "src/components/admin/FeatureConsolePanel.js",
  "src/components/brokers/BrokerDossierIdentity.js",
  "src/components/calendar/AgendaView.js",
  "src/components/calendar/AvailabilityPanel.js",
  "src/components/calendar/CalendarShell.js",
  "src/components/calendar/ConnectCalendarPanel.js",
  "src/components/calendar/EventChip.js",
  "src/components/calendar/ViewingDetailModal.js",
  "src/components/calendar/WeekView.js",
  "src/components/chat/MockupChatbox.js",
  "src/components/connection/ConnectionPortal.js",
  "src/components/connection/ServiceConnectionPortal.js",
  "src/components/connects/ConnectsReceipt.js",
  "src/components/dashboard/BookingModal.js",
  "src/components/dashboard/BrokerMode.js",
  "src/components/dashboard/BulkImporterMode.js",
  "src/components/dashboard/BuyerMode.js",
  "src/components/dashboard/cards/OwnerListingCard.js",
  "src/components/dashboard/ChatBox.js",
  "src/components/dashboard/ConnectsBreakdown.js",
  "src/components/dashboard/crm/AppointmentsSheet.js",
  "src/components/dashboard/crm/DealFileSlideOver.js",
  "src/components/dashboard/crm/LeadExportButton.js",
  "src/components/dashboard/FAQPreflightPanel.js",
  "src/components/dashboard/GeoPricingGauge.js",
  "src/components/dashboard/InventoryGridManager.js",
  "src/components/dashboard/LiveEditorWorkspace.js",
  "src/components/dashboard/MissionControlMode.js",
  "src/components/dashboard/MonthlyFreshnessModal.js",
  "src/components/dashboard/OperatorMode.js",
  "src/components/dashboard/OwnerMode.js",
  "src/components/dashboard/panels/FAQReviewQueue.js",
  "src/components/dashboard/panels/ProjectManagementPanel.js",
  "src/components/dashboard/panels/ScoutInsightPanel.js",
  "src/components/dashboard/panels/TeamManagementPanel.js",
  "src/components/dashboard/PhotoUploader.js",
  "src/components/dashboard/ProviderMode.js",
  "src/components/dashboard/providers/DesignerHUD.js",
  "src/components/dashboard/providers/PhotographerHUD.js",
  "src/components/dashboard/providers/ResearcherHUD.js",
  "src/components/descent/InteractivePanel.js",
  "src/components/flow/MasterFlowGraph.js",
  "src/components/intel/OSINTFlashTicker.js",
  "src/components/layout/BottomNav.js",
  "src/components/legal/LegalDoc.js",
  "src/components/maps/lenses/command.js",
  "src/components/maps/lenses/location.js",
  "src/components/maps/lenses/transit.js",
  "src/components/maps/SpatialCanvas.js",
  "src/components/profile/ProfileContactModal.js",
  "src/components/property/CategorySpecBlock.js",
  "src/components/property/CommercialFlow.js",
  "src/components/property/ComparisonMatrix.js",
  "src/components/property/InquiryModal.js",
  "src/components/property/InteractiveRadiusMap.js",
  "src/components/property/PropertyFAQSection.js",
  "src/components/property/ResidentialFlow.js",
  "src/components/property/SpatialCommandMap.js",
  "src/components/property/UnitInquiryModal.js",
  "src/components/property/UnitMasterPage.js",
  "src/components/property/WhereToSection.js",
  "src/components/ui/EarlyAccessGate.js",
  "src/components/ui/ErrorBoundary.js",
  "src/components/ui/FloatingToolbox.js",
  "src/components/ui/Nudge.js",
  "src/components/ui/TrustBadge.js",
  "src/components/waitlist/WaitlistModal.js",
  "src/context/DashboardContext.js",
  "src/data/mock/investigations.js",
  "src/data/mock/mockQuests.js",
  "src/lib/BadgeEngine.js",
  "src/lib/freshness.js",
  "src/lib/listerRelationship.js",
  "src/lib/notifications.js",
  "src/lib/overpassIntel.js",
  "src/lib/propertyEditorSchema.js",
]);
