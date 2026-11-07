/**
 * Retention constants and cutoff helpers for CRM timeline activity and telemetry.
 *
 * OWNER & FORENSIC AUDIT (A-318, Fourth Sweep F-02 / F-03):
 * Activity logs and telemetry events must not accumulate indefinitely.
 * - CRM timeline activity rows (crm_activity_log) are retained for 90 days.
 * - Analytics event streams (analytics_events) are retained for 90 days.
 * - Security telemetry access logs (security_access_logs) are retained for 90 days.
 */

export const CRM_ACTIVITY_RETENTION_DAYS = 90;
export const ANALYTICS_RETENTION_DAYS = 90;
export const SECURITY_LOGS_RETENTION_DAYS = 90;

/**
 * Cutoff ISO string for crm_activity_log.
 * Rows with `created_at <= cutoff` are eligible for purge.
 */
export function crmActivityRetentionCutoffIso(now = Date.now()) {
  return new Date(now - CRM_ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Cutoff ISO string for analytics_events.
 * Rows with `created_at <= cutoff` are eligible for purge.
 */
export function analyticsRetentionCutoffIso(now = Date.now()) {
  return new Date(now - ANALYTICS_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Cutoff ISO string for security_access_logs.
 * Rows with `last_request_at <= cutoff` are eligible for purge.
 */
export function securityLogsRetentionCutoffIso(now = Date.now()) {
  return new Date(now - SECURITY_LOGS_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
