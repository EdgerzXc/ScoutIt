import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { stripAllTags } from "@/lib/sanitize";
import { sanitizeError } from "@/lib/sanitizeError";
import { rejectIfContactLeak } from "@/lib/contactLeakFilter";
import {
  getPreflightQuestions,
  findPreflightQuestion,
  preflightProgress,
} from "@/lib/faqPreflight";

// ─────────────────────────────────────────────────────────────────────────
// OWNER FAQ PRE-FLIGHT CHECKLIST
//
//   GET  /api/faqs/preflight?propertyId=<slug>
//        -> the standard buyer questions for this listing's category,
//           merged with whatever the owner has already answered
//
//   POST /api/faqs/preflight { propertyId, answers: [{ key, answer }] }
//        -> idempotent bulk save. Seeds the questions (source='preflight')
//           and writes the owner's gold-tier answers.
//
// OWNER ONLY. This is the one path that mints gold-tier answers in bulk, so
// the ownership check is the security boundary -- if it leaks, anyone can
// post "OWNER VERIFIED" claims on someone else's listing.
//
// We seed questions, never answers. See src/lib/faqPreflight.js for why.
// ─────────────────────────────────────────────────────────────────────────

const saveSchema = z.object({
  propertyId: z.string().min(1).max(200),
  answers: z
    .array(
      z.object({
        key: z.string().min(1).max(60),
        // "" means "clear this answer" -- the owner retracting is legitimate
        answer: z.string().max(2000),
      }),
    )
    .min(1)
    .max(30),
});

function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

/**
 * Resolves the listing and asserts the caller owns it.
 * @returns {Promise<{ property: object }|{ error: NextResponse }>}
 */
async function requireOwnedProperty(userId, slug) {
  const { data: property, error } = await supabaseAdmin
    .from("properties")
    .select("id, slug, title, owner_id, space_category")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { error: fail("Failed to load listing", 500) };
  if (!property) return { error: fail("Listing not found", 404) };
  if (!property.owner_id || property.owner_id !== userId) {
    return { error: fail("Only the listing owner can answer these questions.", 403) };
  }
  return { property };
}

// ── GET: checklist + existing answers ────────────────────────────────────
export async function GET(req) {
  try {
    if (!supabaseAdmin) return fail("Server error: missing service role configuration", 500);

    const userId = await resolveUserId(req);
    if (!userId) return fail("Sign in to continue.", 401);

    const slug = new URL(req.url).searchParams.get("propertyId");
    if (!slug) return fail("Missing propertyId");

    const owned = await requireOwnedProperty(userId, slug);
    if (owned.error) return owned.error;

    const category = owned.property.space_category;
    const questions = getPreflightQuestions(category);

    const { data: seeded } = await supabaseAdmin
      .from("property_faqs")
      .select("id, preflight_key")
      .eq("property_id", slug)
      .eq("source", "preflight");

    const faqIdByKey = {};
    for (const row of seeded || []) {
      if (row.preflight_key) faqIdByKey[row.preflight_key] = row.id;
    }

    const answerByFaqId = {};
    const faqIds = Object.values(faqIdByKey);
    if (faqIds.length) {
      const { data: answers } = await supabaseAdmin
        .from("property_faq_answers")
        .select("faq_id, answer_text, updated_at")
        .in("faq_id", faqIds)
        .eq("answer_tier", "gold");
      for (const a of answers || []) answerByFaqId[a.faq_id] = a;
    }

    const merged = questions.map((q) => {
      const faqId = faqIdByKey[q.key];
      const existing = faqId ? answerByFaqId[faqId] : null;
      return {
        key: q.key,
        question: q.question,
        hint: q.hint,
        answer: existing?.answer_text || "",
        answeredAt: existing?.updated_at || null,
      };
    });

    const answeredCount = merged.filter((q) => q.answer.trim().length > 0).length;

    return NextResponse.json(
      {
        success: true,
        propertyTitle: owned.property.title,
        category,
        questions: merged,
        progress: preflightProgress(category, answeredCount),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/faqs/preflight] GET failed:", error);
    return fail(sanitizeError(error, "Failed to load the checklist."), 500);
  }
}

// ── POST: idempotent bulk save ───────────────────────────────────────────
export async function POST(req) {
  try {
    if (!supabaseAdmin) return fail("Server error: missing service role configuration", 500);

    const userId = await resolveUserId(req);
    if (!userId) return fail("Sign in to continue.", 401);

    const parsed = saveSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid checklist payload");

    const { propertyId: slug, answers } = parsed.data;

    const owned = await requireOwnedProperty(userId, slug);
    if (owned.error) return owned.error;

    const category = owned.property.space_category;

    // Validate + clean everything BEFORE writing anything, so a single bad
    // entry doesn't leave the checklist half-saved.
    const staged = [];
    for (const entry of answers) {
      const question = findPreflightQuestion(category, entry.key);
      if (!question) return fail(`Unknown question: ${entry.key}`, 400);

      const text = stripAllTags(entry.answer).trim();

      if (text.length === 0) {
        staged.push({ question, text: "", clear: true });
        continue;
      }
      if (text.length < 2) return fail(`Answer for "${question.question}" is too short.`, 400);

      const leak = rejectIfContactLeak(text);
      if (leak) {
        return fail(`${leak.message} (on: "${question.question}")`, 422, { code: leak.code, key: entry.key });
      }

      staged.push({ question, text, clear: false });
    }

    let saved = 0;
    let cleared = 0;

    for (const item of staged) {
      // Upsert the seeded question. The partial unique index on
      // (property_id, preflight_key) makes this idempotent.
      const { data: faq, error: faqError } = await supabaseAdmin
        .from("property_faqs")
        .upsert(
          {
            property_id: slug,
            question_text: item.question.question,
            asked_by_user_id: null, // ScoutIt-authored, not asked by a user
            source: "preflight",
            preflight_key: item.question.key,
            is_hidden: false,
          },
          { onConflict: "property_id,preflight_key" },
        )
        .select("id")
        .single();

      if (faqError) throw faqError;

      if (item.clear) {
        const { error: delError } = await supabaseAdmin
          .from("property_faq_answers")
          .delete()
          .eq("faq_id", faq.id)
          .eq("answer_tier", "gold");
        if (delError) throw delError;
        cleared += 1;
        continue;
      }

      // Owner answers are canonical on arrival -- is_verified is true because
      // the ownership check above already proved authority.
      const { error: ansError } = await supabaseAdmin
        .from("property_faq_answers")
        .upsert(
          {
            faq_id: faq.id,
            author_id: userId,
            author_role: "owner",
            answer_tier: "gold",
            answer_text: item.text,
            is_verified: true,
            is_hidden: false,
          },
          { onConflict: "faq_id,answer_tier" },
        );

      if (ansError) throw ansError;
      saved += 1;
    }

    // Recount from the database rather than trusting the payload -- the owner
    // may be saving a partial edit of a checklist they filled in earlier.
    const { data: seeded } = await supabaseAdmin
      .from("property_faqs")
      .select("id")
      .eq("property_id", slug)
      .eq("source", "preflight");

    let answeredCount = 0;
    if (seeded?.length) {
      const { count } = await supabaseAdmin
        .from("property_faq_answers")
        .select("id", { count: "exact", head: true })
        .in("faq_id", seeded.map((s) => s.id))
        .eq("answer_tier", "gold");
      answeredCount = count || 0;
    }

    return NextResponse.json(
      {
        success: true,
        saved,
        cleared,
        progress: preflightProgress(category, answeredCount),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/faqs/preflight] POST failed:", error);
    return fail(sanitizeError(error, "Failed to save the checklist."), 500);
  }
}
