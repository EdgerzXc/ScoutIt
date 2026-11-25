import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { statusFromDateOfBirth } from "@/lib/adultEligibility";
import { writeAuditLog } from "@/lib/auditTrail";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

const NO_STORE = { "Cache-Control": "private, no-store" };
const checkDobReadRate = createRateLimiter({ limit: 60, windowMs: 60_000, maxKeys: 10_000 });
const checkDobWriteRate = createRateLimiter({ limit: 20, windowMs: 60_000, maxKeys: 10_000 });

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
    }

    const rate = checkDobReadRate(`${clientIp(request)}:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503, headers: NO_STORE });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("date_of_birth, adult_eligibility_status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: sanitizeError(error, "Could not load date of birth.") },
        { status: 500, headers: NO_STORE },
      );
    }

    return NextResponse.json(
      {
        success: true,
        dateOfBirth: profile?.date_of_birth || null,
        adultEligibilityStatus: profile?.adult_eligibility_status || "unknown",
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to load date of birth.") },
      { status: 500, headers: NO_STORE },
    );
  }
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
    }

    const rate = checkDobWriteRate(`${clientIp(request)}:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again shortly." },
        { status: 429, headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503, headers: NO_STORE });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400, headers: NO_STORE },
      );
    }
    const rawDob = typeof body.dateOfBirth === "string" ? body.dateOfBirth.trim() : "";

    const check = statusFromDateOfBirth(rawDob);
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error || "A valid date of birth confirming age 18+ is required." },
        { status: 400, headers: NO_STORE },
      );
    }

    const { error: updateErr } = await supabaseAdmin
      .from("user_profiles")
      .update({
        date_of_birth: rawDob,
        adult_eligibility_status: check.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateErr) {
      console.error("[DOB API] Failed to update date of birth:", updateErr);
      return NextResponse.json(
        { error: "Failed to update date of birth in your profile." },
        { status: 500, headers: NO_STORE },
      );
    }

    await writeAuditLog(supabaseAdmin, {
      action: "DATE_OF_BIRTH_VERIFIED",
      tableName: "user_profiles",
      recordId: userId,
      userId,
      metadata: {
        status: check.status,
        age: check.age,
      },
    });

    return NextResponse.json(
      {
        success: true,
        dateOfBirth: rawDob,
        adultEligibilityStatus: check.status,
        message: "Date of birth and 18+ adult eligibility verified.",
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("[DOB API] Unhandled error:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Failed to record date of birth.") },
      { status: 500 },
    );
  }
}
