import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";

/**
 * A-063 — make a scheduled job's run visible.
 *
 * Four cron jobs run in production and, until now, left no trace anywhere a
 * staff member could read. A job that quietly stopped firing, or fired and
 * failed, looked exactly like a job with nothing to do.
 *
 * Wraps a route handler rather than living inside each one, so the record is
 * one line per job and cannot drift between them.
 *
 * Three deliberate choices:
 *
 * - **A rejected call is not a run.** `authorizeCronRequest` answers 401 or 503
 *   before any work happens. Logging those as job runs would fill the log with
 *   probes and make a genuinely missing run impossible to spot.
 * - **The handler's own response is passed through untouched.** The body is
 *   read from a clone, so instrumenting a job cannot change what Vercel sees.
 * - **A throw is recorded and then re-thrown.** Swallowing it here would turn a
 *   crashed job into a silent success, which is the failure mode this closes.
 *
 * @param {string} job - stable job name, e.g. "purge-chat-messages"
 * @param {(request: Request) => Promise<Response>} handler
 */
export function withCronEventLog(job, handler) {
  return async function instrumentedCronHandler(request) {
    const startedAt = Date.now();

    let response;
    try {
      response = await handler(request);
    } catch (err) {
      await recordSystemEvent({
        event: EVENTS.CRON_FAILED,
        severity: "error",
        subjectTable: "cron",
        subjectId: job,
        summary: `Cron ${job} crashed: ${err.message}`,
        detail: { job, error: err.message, durationMs: Date.now() - startedAt },
      });
      throw err;
    }

    // Unauthorized or unconfigured — the job never ran.
    if (response.status === 401 || response.status === 503) return response;

    let result = null;
    try {
      result = await response.clone().json();
    } catch {
      // A non-JSON body is not worth failing over; the status still tells the story.
    }

    const ok = response.status < 400;
    const durationMs = Date.now() - startedAt;

    await recordSystemEvent({
      event: ok ? EVENTS.CRON_COMPLETED : EVENTS.CRON_FAILED,
      severity: ok ? "info" : "error",
      subjectTable: "cron",
      subjectId: job,
      summary: ok
        ? `Cron ${job} completed in ${durationMs}ms`
        : `Cron ${job} returned ${response.status}`,
      detail: { job, status: response.status, durationMs, result },
    });

    return response;
  };
}
