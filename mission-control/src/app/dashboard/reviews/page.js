import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import ReviewsClient from "./ReviewsClient";
import { Scale } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const staff = await getCurrentStaff();
  if (!staff || staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=Unauthorized");
  }

  const admin = createAdminClient();
  let reviews = [];
  let initialError = null;

  try {
    const { data, error } = await admin
      .from("user_behavioral_reviews")
      .select("id, reviewer_id, target_user_id, lease_type, duration_months, vectors, feedback, submitted_at, is_double_blind_locked, is_disputed, disputed_at, dispute_reason, dispute_resolution, created_at")
      .order("is_disputed", { ascending: false })
      .order("disputed_at", { ascending: false, nullsFirst: false })
      .order("submitted_at", { ascending: false });

    if (error) {
      initialError = error.message;
    } else {
      reviews = data || [];

      // Resolve user details
      const userIds = [
        ...new Set([
          ...reviews.map((r) => r.reviewer_id),
          ...reviews.map((r) => r.target_user_id),
        ].filter(Boolean)),
      ];

      if (userIds.length > 0) {
        const { data: profiles } = await admin
          .from("user_profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        reviews = reviews.map((r) => ({
          ...r,
          reviewer_name: profileMap.get(r.reviewer_id)?.full_name || null,
          reviewer_email: profileMap.get(r.reviewer_id)?.email || null,
          target_name: profileMap.get(r.target_user_id)?.full_name || null,
          target_email: profileMap.get(r.target_user_id)?.email || null,
        }));
      }
    }
  } catch (err) {
    initialError = err.message || String(err);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Scale className="h-6 w-6 text-[#E8AE3C]" />
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              Behavioral Review Disputes
            </h1>
          </div>
          <p className="mt-1 text-xs text-white/60">
            A-266 · Trust &amp; Safety arbitration queue for disputed tenant, renter, and buyer reviews.
          </p>
        </div>
      </div>

      <ReviewsClient reviews={reviews} initialError={initialError} />
    </div>
  );
}
