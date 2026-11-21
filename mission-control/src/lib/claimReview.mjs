const REVIEW_ERRORS = {
  invalid: "Choose a valid decision and enter a review note.",
  denied: "Your staff account cannot make this decision.",
  changed: "This claim changed. Refresh the queue before deciding.",
  property_missing: "The listing is no longer available.",
  property_changed: "The listing is no longer eligible for this transfer.",
  publication_pending: "The listing has another publication update pending.",
  scan_required: "Approval using attached documents requires a verified security scan.",
  profile_missing: "The claimant needs an active account profile before the listing can transfer.",
  binding_required: "Verify the listing’s public record in reconciliation before approving the claim.",
  busy: "Another reviewer is processing this transfer. Check the queue before retrying.",
  retry: "The transfer is still pending. Retry approval to finish the catalogue update.",
};

export async function reviewPropertyClaim({ admin, claimId, staffId, transition, expectedUpdatedAt, reason, note, unpublish }) {
  const args = {
    p_claim_id: claimId,
    p_actor_id: staffId,
    p_transition: transition,
    p_expected_updated_at: expectedUpdatedAt,
    p_reason: reason,
    p_note: note,
  };
  const review = async (phase, lease = null) => {
    const { data, error } = await admin.rpc("review_property_claim", { ...args, p_phase: phase, p_lease: lease });
    if (error) {
      console.error("[claim review] Database decision could not be confirmed", phase, error.code || error.name);
      return { state: "unavailable" };
    }
    return data || { state: "unavailable" };
  };

  let result = await review("decide");
  if (result.state === "withdraw") {
    const { slug, recordId, lease } = result;
    if (typeof slug !== "string" || !slug.trim() || !/^rec[A-Za-z0-9]+$/.test(recordId || "") ||
        !Number.isFinite(Date.parse(lease)) || Date.now() - Date.parse(lease) >= 60_000) {
      return { ok: false, message: "The catalogue withdrawal could not be confirmed. Refresh the queue and retry approval." };
    }
    try {
      const withdrawal = await unpublish({ slug, recordId });
      if (withdrawal?.recordId !== recordId || !withdrawal?.cache?.purged) throw new Error("Withdrawal is unconfirmed");
    } catch {
      await review("release", lease);
      return { ok: false, message: "Catalogue removal is pending. The listing still belongs to its current holder. Retry approval to finish." };
    }
    result = await review("confirm", lease);
    if (result.state !== "saved") {
      await review("release", lease);
      return { ok: false, message: "The catalogue confirmed removal. Refresh the claim queue to confirm whether ownership transferred before retrying." };
    }
  }
  return result.state === "saved"
    ? { ok: true, status: result.status, updatedAt: result.updatedAt, transfer: result.transfer }
    : { ok: false, message: REVIEW_ERRORS[result.state] || "Could not confirm the claim decision. Refresh the queue before retrying." };
}
