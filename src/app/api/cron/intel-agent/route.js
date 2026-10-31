import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cronAuth";
import {
  generateAutonomousIntelBriefing,
  listAvailableAgentBlueprints,
  getBlueprintById,
} from "@/lib/ai/autonomousIntelAgent";
import { requireAdmin } from "@/lib/adminGuard";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * ═════════════════════════════════════════════════════════════════════════
 * /api/cron/intel-agent — Autonomous Intel Article Generation Agent Bot (A-195)
 * ═════════════════════════════════════════════════════════════════════════
 * Periodically or on-demand synthesizes publish-ready market intelligence
 * articles with interactive building widgets.
 *
 * Auth:
 * - Vercel Cron: `Authorization: Bearer CRON_SECRET`
 * - Staff Session: Supabase Auth JWT token (enforces staff/admin role)
 */

async function isStaffAuthorized(request) {
  try {
    const auth = await requireAdmin(request, { label: "INTEL AGENT CRON" });
    return Boolean(auth?.userId && !auth?.error);
  } catch {
    return false;
  }
}

async function verifyAuth(request) {
  // 1. Try cron secret
  const cronFailure = authorizeCronRequest(request);
  if (!cronFailure) return { ok: true, source: "cron" };

  // 2. Try staff session token
  const staffOk = await isStaffAuthorized(request);
  if (staffOk) return { ok: true, source: "staff" };

  // If neither, return the cron auth failure response
  return { ok: false, response: cronFailure };
}

export async function GET(request) {
  const auth = await verifyAuth(request);
  if (!auth.ok) return auth.response;

  const blueprints = listAvailableAgentBlueprints();

  return NextResponse.json({
    status: "healthy",
    agent: "ScoutIt Autonomous Market Intelligence Bot v1.0",
    blueprintCount: blueprints.length,
    availableBlueprints: blueprints,
  });
}

export async function POST(request) {
  const auth = await verifyAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { blueprintId = "the-estate-makati", dryRun = true, customTopic } = body;

    const blueprint = getBlueprintById(blueprintId);
    if (!blueprint) {
      return NextResponse.json(
        { error: `Invalid blueprintId: '${blueprintId}'. Must be one of available blueprints.` },
        { status: 400 }
      );
    }

    const result = await generateAutonomousIntelBriefing({
      blueprintId,
      customTopic,
      dryRun: Boolean(dryRun),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[AUTONOMOUS_INTEL_AGENT] Generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate autonomous intel briefing", details: sanitizeError(error) },
      { status: 500 }
    );
  }
}
