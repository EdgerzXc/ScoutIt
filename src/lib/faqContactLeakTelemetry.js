const FAQ_LEAK_RULE_CODES = new Set([
  "email",
  "ph_mobile",
  "ph_landline",
  "long_digit_run",
  "messaging_handle",
  "social_handle",
  "external_link",
  "bypass_solicitation",
]);

const FAQ_LEAK_CONTEXTS = new Set([
  "public_question",
  "public_answer",
  "owner_preflight_answer",
]);

export function buildFaqContactLeakTelemetry(ruleCode, context, now = new Date().toISOString()) {
  if (!FAQ_LEAK_RULE_CODES.has(ruleCode) || !FAQ_LEAK_CONTEXTS.has(context)) return null;
  return {
    masked_ip: "telemetry_faq_contact_filter",
    route_accessed: `FRICTION:faq_contact_leak:${context}:${ruleCode}`,
    request_count: 1,
    is_flagged: true,
    flag_reason: "FAQ contact-leak filter blocked a submission",
    last_request_at: now,
  };
}

export async function recordFaqContactLeakTelemetry(database, { ruleCode, context }) {
  const payload = buildFaqContactLeakTelemetry(ruleCode, context);
  if (!database || !payload) return false;
  const { error } = await database.from("security_access_logs").insert(payload);
  if (error) throw error;
  return true;
}
