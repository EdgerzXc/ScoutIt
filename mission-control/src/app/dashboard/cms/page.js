import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { approveProperty, rejectProperty, setPropertyArchived, bulkArchiveProperties } from "./actions";
import { CheckCircle2, XCircle, Archive, ArchiveRestore, MapPin, UploadCloud } from "lucide-react";
import { BulkSelectManager } from "@/components/dashboard/BulkSelectManager";
import PropertyEditorPanel from "@/components/dashboard/PropertyEditorPanel";

const REJECTION_REASONS = [
  { code: "photos_blurry", label: "Photos too blurry / low quality" },
  { code: "price_unrealistic", label: "Price unrealistic or unverified" },
  { code: "missing_info", label: "Missing required info (title, location, category)" },
  { code: "suspected_duplicate", label: "Suspected duplicate or fraudulent listing" },
  { code: "other", label: "Other (see note)" },
];

const STATUS_TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
];

export default async function PropertyCmsPage({ searchParams }) {
  const staff = await getCurrentStaff();
  const params = await searchParams;
  const status = STATUS_TABS.some((t) => t.key === params?.status) ? params.status : "pending";

  const admin = createAdminClient();
  const { data: properties, error } = await admin
    .from("properties")
    .select(
      // space_category drives which category fields the section editor shows.
      // `details` is deliberately NOT selected — PropertyEditorPanel fetches the
      // full row only for the rows a staff member actually expands.
      "id, created_at, owner_id, title, type, location, price, description, media_link, verified, completeness_score, moderation_status, rejection_reason, space_category"
    )
    .eq("moderation_status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(50);

  const canArchive = staff.tier >= TIERS.OPS_MANAGER;
  const bulkActions = [];
  if (canArchive && status !== "archived") {
    bulkActions.push({
      label: "Archive Properties",
      icon: <Archive className="w-4 h-4" />,
      requiresReason: true,
      className: "bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20",
      fn: bulkArchiveProperties,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Property Review Queue</h1>
        <Link
          href="/dashboard/cms/import"
          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/70 transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Bulk import CSV
        </Link>
      </div>

      <div className="flex gap-1 bg-[#121212] border border-white/5 rounded-xl p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/cms?status=${tab.key}`}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              status === tab.key
                ? "bg-[#E8AE3C] text-black font-medium"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Failed to load properties: {error.message}
        </div>
      )}

      {properties && (
        <BulkSelectManager
          items={properties.map((p) => ({
            key: p.id,
            content: <PropertyCard property={p} staff={staff} />,
          }))}
          itemName="properties"
          bulkActions={bulkActions}
        />
      )}
    </div>
  );
}

function PropertyCard({ property: p, staff }) {
  const canArchive = staff.tier >= TIERS.OPS_MANAGER;
  const canEditDetails = staff.tier >= TIERS.OPS_MANAGER;
  const isArchived = p.moderation_status === "archived";

  return (
    <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-2">
      {/* Left: public-facing preview */}
      <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/5">
        <div className="text-[10px] uppercase tracking-wide text-white/30 mb-3">
          Live site preview
        </div>
        <h2 className="text-lg font-medium text-white mb-1">
          {p.title || "Untitled property"}
        </h2>
        <div className="flex items-center gap-1.5 text-sm text-white/50 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          {p.location || "No location set"}
        </div>
        <div className="text-sm text-[#E8AE3C] mb-3">
          {p.price ? `₱${Number(p.price).toLocaleString()}` : "Price on request"}
        </div>
        <p className="text-sm text-white/60 leading-relaxed mb-4">
          {p.description || "No description provided."}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-white/40">
          <span className="bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
            {p.type || "Uncategorized"}
          </span>
          <span className="bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
            Completeness: {p.completeness_score ?? 0}%
          </span>
          {p.verified && (
            <span className="bg-green-400/10 text-green-400 border border-green-400/20 rounded-full px-2 py-0.5">
              Verified
            </span>
          )}
        </div>
        {p.media_link && (
          <div className="mt-3 text-xs text-white/40 truncate">
            3D / media: <span className="text-white/60">{p.media_link}</span>
          </div>
        )}
      </div>

      {/* Right: action panel */}
      <div className="p-6 space-y-4">
        <div className="text-[10px] uppercase tracking-wide text-white/30">Actions</div>

        {p.rejection_reason && (
          <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
            {p.rejection_reason}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <form action={approveProperty}>
            <input type="hidden" name="propertyId" value={p.id} />
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/20 transition-colors"
              title="Publishes to Airtable (Approved_For_ScoutIt) — this puts the listing on the live public site"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve &amp; Publish to live site
            </button>
          </form>

          {canArchive && (
            <form action={setPropertyArchived}>
              <input type="hidden" name="propertyId" value={p.id} />
              <input type="hidden" name="nextValue" value={(!isArchived).toString()} />
              {!isArchived && <input type="hidden" name="reason" value="Archived via CMS queue" />}
              <button className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors">
                {isArchived ? (
                  <ArchiveRestore className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                {isArchived ? "Restore to pending" : "Archive"}
              </button>
            </form>
          )}
        </div>

        <form action={rejectProperty} className="space-y-2 pt-2 border-t border-white/5">
          <label className="text-xs text-white/50 block">
            Reject with reason
            <select
              name="reasonLabel"
              required
              defaultValue=""
              className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="" disabled>
                Choose a reason...
              </option>
              {REJECTION_REASONS.map((r) => (
                <option key={r.code} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <input
            name="reasonNote"
            placeholder="Optional note to the owner"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
          <input type="hidden" name="propertyId" value={p.id} />
          <button className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 transition-colors">
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </form>
      </div>
      </div>

      {/* Full-width: the shared section editor. Gated to Ops Manager+ to match
          the tier /api/property enforces server-side — showing a control that
          always 403s would just look broken. */}
      {canEditDetails && (
        <PropertyEditorPanel propertyId={p.id} spaceCategory={p.space_category} />
      )}
    </div>
  );
}
