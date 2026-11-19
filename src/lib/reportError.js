import * as Sentry from "@sentry/nextjs";
import { supabase } from "./supabaseClient";
import browserRoutes from "@/data/flow/browserFlowRoutes.json";
import { createFlowNodeResolver } from "./flow/createFlowNodeResolver";

const { resolveFlowNode } = createFlowNodeResolver(browserRoutes);

/**
 * Sends an error or user-submitted problem report to the configured Sentry
 * project. Session Replay remains disabled; reports contain only the submitted
 * text, bounded diagnostic context, the page path, and an optional verified
 * opaque Supabase user id.
 * Tags events with a browser-safe flow node ID and domain.
 * Best-effort: never throws (we do not want the logger to cause errors).
 * @param {{ kind?: 'crash'|'user_report', message?: string, stack?: string, context?: object, nodeId?: string }} payload
 */
export async function reportError(payload = {}) {
  try {
    const client = Sentry.getClient();
    if (!client?.getOptions?.().dsn) return false;

    const message = String(payload.message || "").trim().slice(0, 2000);
    if (!message) return false;

    const { data } = await supabase.auth.getUser();
    const kind = payload.kind === "user_report" ? "user_report" : "crash";
    const pagePath = typeof window !== "undefined" ? window.location.pathname : "";
    const flowNode = payload.nodeId ? resolveFlowNode(null, payload.nodeId) : resolveFlowNode(pagePath);

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      try {
        window.dispatchEvent(
          new CustomEvent("scoutit:flow-error", {
            detail: {
              nodeId: payload.nodeId || flowNode?.nodeId || "unknown_node",
              message,
              route: pagePath,
              severity: payload.kind === "crash" ? "CRITICAL" : "HIGH",
            },
          })
        );
      } catch {
        // Best effort dispatch
      }
    }

    Sentry.withScope((scope) => {
      scope.setTag("scoutit.report_kind", kind);
      if (flowNode) {
        scope.setTag("scoutit.flow_node_id", flowNode.nodeId);
        scope.setTag("scoutit.flow_domain", flowNode.domain);
        if (flowNode.roles?.[0]) scope.setTag("scoutit.flow_role", flowNode.roles[0]);
      }

      scope.setContext("scoutit_report", {
        page_path: pagePath,
        context: payload.context || {},
      });

      if (flowNode) {
        scope.setContext("scoutit_flow", {
          node_id: flowNode.nodeId,
          canonical_id: flowNode.canonicalId,
          domain: flowNode.domain,
        });
      }

      if (data?.user?.id) scope.setUser({ id: data.user.id });

      if (kind === "user_report") {
        Sentry.captureMessage(message, "info");
        return;
      }

      const error = new Error(message);
      error.name = "ScoutItClientCrash";
      if (payload.stack) error.stack = String(payload.stack).slice(0, 8000);
      Sentry.captureException(error);
    });

    return await Sentry.flush(2000);
  } catch {
    return false;
  }
}
