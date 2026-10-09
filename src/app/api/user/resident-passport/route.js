import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserResidentPassport } from "@/lib/scoring/serverBehavioralScoring";
import { PASSPORT_SCOPES } from "@/lib/scoring/residentPassport";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * GET /api/user/resident-passport
 * Retrieves the authenticated user's private Resident Passport & trust metrics.
 * Supports:
 * - scope=public_summary (default)
 * - scope=consented_application (with optional dealId)
 */
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to access resident passport credentials." },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedScope = searchParams.get("scope");
    const dealId = searchParams.get("dealId") || null;

    const scope = requestedScope === PASSPORT_SCOPES.CONSENTED_APPLICATION
      ? PASSPORT_SCOPES.CONSENTED_APPLICATION
      : PASSPORT_SCOPES.PUBLIC_SUMMARY;

    const { passport, metrics } = await getUserResidentPassport(
      supabaseAdmin,
      userId,
      scope,
      dealId
    );

    if (!passport) {
      return NextResponse.json(
        { error: "Failed to generate resident passport." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      passport,
      metrics,
    });
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to retrieve resident passport.") },
      { status: 500 }
    );
  }
}
