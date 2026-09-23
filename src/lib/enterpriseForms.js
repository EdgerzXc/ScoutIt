// ─────────────────────────────────────────────────────────────────────────
// ENTERPRISE FREE-INQUIRY FORM CHECK (A-144 §10.10)
//
// "Free Inquiry" must be an enabled, server-validated Enterprise form — never
// a nonempty string the caller typed. The tables are migration-gated (O-004:
// 20260914000001, NOT applied). Until they exist this check fails OPEN with a
// warn-once so the legacy public form keeps working; once the tables exist a
// forged, disabled or mismatched form fails CLOSED with 0 debit and no
// delivery. Never throws.
// ─────────────────────────────────────────────────────────────────────────

let enterpriseWarned = false;
function warnOnce(msg, detail) {
  if (!enterpriseWarned) {
    console.warn(msg, detail || "");
    enterpriseWarned = true;
  }
}

/**
 * Resolve an enterprise_form_id against the live tables.
 * Returns { ok: true, form } or { ok: false, reason }.
 * - No formId (null/empty): not an enterprise submission — { ok: true, form: null }.
 * - Tables missing (42P01/42703): pre-migration graceful — { ok: true, form: null, ungated: true }.
 * - Form id unknown / disabled: { ok: false } — caller must refuse delivery.
 */
export async function resolveEnterpriseForm(supabaseAdmin, formId) {
  if (!formId || (typeof formId === "string" && formId.trim() === "")) {
    return { ok: true, form: null };
  }
  if (!supabaseAdmin) return { ok: false, reason: "unavailable" };
  try {
    const { data, error } = await supabaseAdmin
      .from("enterprise_inquiry_forms")
      .select("id, enterprise_id, enabled")
      .eq("id", formId)
      .maybeSingle();
    if (error) {
      const code = error.code || "";
      if (code === "42P01" || code === "42703" || /does not exist|undefined_table|undefined_column/i.test(error.message || "")) {
        warnOnce("[ENTERPRISE FORMS] tables unavailable — free-inquiry scoping deferred (pre-migration):", code || error.message);
        return { ok: true, form: null, ungated: true };
      }
      return { ok: false, reason: "unavailable" };
    }
    if (!data) return { ok: false, reason: "unknown_form" };
    if (data.enabled !== true) return { ok: false, reason: "disabled_form" };
    return { ok: true, form: data };
  } catch (err) {
    warnOnce("[ENTERPRISE FORMS] check skipped (exception):", err?.message);
    return { ok: false, reason: "unavailable" };
  }
}
