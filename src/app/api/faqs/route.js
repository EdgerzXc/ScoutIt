import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { stripAllTags } from "@/lib/sanitize";
import { rejectIfContactLeak } from "@/lib/contactLeakFilter";
import { notifyUser } from "@/lib/notifications";

// ─────────────────────────────────────────────────────────────────────────
// PER-PROPERTY 3-TIER FAQ API  (NEW_IDEAS.md §4)
//
//   GET  /api/faqs?propertyId=<slug>   -> public, cacheable, no auth
//   POST /api/faqs  { propertyId, question }        -> ask a question
//   POST /api/faqs  { faqId, answer }               -> answer a question
//
// TIER IS NEVER TRUSTED FROM THE CLIENT. The server derives it:
//   🥇 gold   -> the property's owner_id matches the caller
//   🥈 silver -> caller has a verified PRC licence, or holds the broker /
//                provider hat in active_roles (verified advisor)
//   🥉 bronze -> everyone else (resident / current tenant lived reality)
//
// Every free-text field passes through the contact-leak filter before it
// touches the database -- the FAQ layer is the widest open-text surface on
// the platform and would otherwise be a free bypass around Connects.
// ─────────────────────────────────────────────────────────────────────────

const askSchema = z.object({
  propertyId: z.string().min(1).max(200),
  question: z.string().min(5).max(500),
});

const answerSchema = z.object({
  faqId: z.string().uuid(),
  answer: z.string().min(2).max(2000),
});

const TIER_BY_ROLE = { owner: "gold", advisor: "silver", resident: "bronze" };

function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

/**
 * Derives the caller's answer authority for a given property slug.
 * @returns {Promise<{ role: string, tier: string }>}
 */
async function resolveAuthority(userId, propertySlug) {
  const { data: property } = await supabaseAdmin
    .from("properties")
    .select("owner_id")
    .eq("slug", propertySlug)
    .maybeSingle();

  if (property?.owner_id && property.owner_id === userId) {
    return { role: "owner", tier: TIER_BY_ROLE.owner };
  }

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("active_roles, prc_verified")
    .eq("id", userId)
    .maybeSingle();

  const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
  const isAdvisor =
    profile?.prc_verified === true ||
    roles.includes("broker") ||
    roles.includes("provider");

  return isAdvisor
    ? { role: "advisor", tier: TIER_BY_ROLE.advisor }
    : { role: "resident", tier: TIER_BY_ROLE.resident };
}

// ── GET: public Q&A thread for one property ──────────────────────────────
export async function GET(req) {
  try {
    if (!supabaseAdmin) return fail("Server error: missing service role configuration", 500);

    const propertyId = new URL(req.url).searchParams.get("propertyId");
    if (!propertyId) return fail("Missing propertyId");

    const { data: questions, error: qError } = await supabaseAdmin
      .from("property_faqs")
      .select("id, question_text, created_at, asked_by_user_id, source")
      .eq("property_id", propertyId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (qError) throw qError;
    if (!questions?.length) {
      return NextResponse.json({ success: true, faqs: [] }, { status: 200 });
    }

    const { data: answers, error: aError } = await supabaseAdmin
      .from("property_faq_answers")
      .select("id, faq_id, answer_text, answer_tier, author_role, author_id, is_verified, created_at")
      .in("faq_id", questions.map((q) => q.id))
      .eq("is_hidden", false);

    if (aError) throw aError;

    // Resolve display names in one round trip. Never expose raw user IDs,
    // emails or connects_balance to the public FAQ payload.
    const ids = [
      ...new Set(
        [...questions.map((q) => q.asked_by_user_id), ...(answers || []).map((a) => a.author_id)]
          .filter(Boolean),
      ),
    ];

    const nameById = {};
    if (ids.length) {
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name, firm, prc_verified")
        .in("id", ids);
      for (const p of profiles || []) {
        nameById[p.id] = { name: p.display_name || "ScoutIt Member", firm: p.firm || null, prcVerified: !!p.prc_verified };
      }
    }

    // Highest authority first: gold > silver > bronze.
    const TIER_RANK = { gold: 0, silver: 1, bronze: 2 };

    const faqs = questions
      .map((q) => ({
        id: q.id,
        question: q.question_text,
        askedAt: q.created_at,
        source: q.source || "public",
        // Pre-flight questions are ScoutIt-authored, not asked by a person --
        // attributing them to a member would be a lie.
        askedBy: q.source === "preflight" ? null : (nameById[q.asked_by_user_id]?.name || "ScoutIt Member"),
        answers: (answers || [])
          .filter((a) => a.faq_id === q.id)
          .sort((a, b) => TIER_RANK[a.answer_tier] - TIER_RANK[b.answer_tier])
          .map((a) => ({
            id: a.id,
            text: a.answer_text,
            tier: a.answer_tier,
            role: a.author_role,
            isVerified: a.is_verified,
            answeredAt: a.created_at,
            author: nameById[a.author_id]?.name || "ScoutIt Member",
            firm: nameById[a.author_id]?.firm || null,
          })),
      }))
      // An unanswered pre-flight question is a prompt the owner hasn't filled
      // in yet -- showing it publicly would turn the wall into a list of
      // blanks, which is worse than no section at all. Unanswered questions a
      // real person asked DO stay visible: that's pressure on the owner, and
      // the asker deserves to see their question standing.
      .filter((f) => f.source !== "preflight" || f.answers.length > 0)
      // Answered first, then most recent.
      .sort((a, b) => {
        if (!!a.answers.length !== !!b.answers.length) return a.answers.length ? -1 : 1;
        return new Date(b.askedAt) - new Date(a.askedAt);
      });

    return NextResponse.json({ success: true, faqs }, { status: 200 });
  } catch (error) {
    console.error("[api/faqs] GET failed:", error);
    return fail("Failed to load questions", 500);
  }
}

// ── POST: ask a question, or answer one ──────────────────────────────────
export async function POST(req) {
  try {
    if (!supabaseAdmin) return fail("Server error: missing service role configuration", 500);

    const userId = await resolveUserId(req);
    if (!userId) return fail("Sign in to join the conversation on this listing.", 401);

    const body = await req.json();

    // ── Branch A: answering an existing question ──────────────────────
    if (body?.faqId) {
      const parsed = answerSchema.safeParse(body);
      if (!parsed.success) return fail("Invalid answer format");

      const answer = stripAllTags(parsed.data.answer).trim();
      if (answer.length < 2) return fail("Answer is empty");

      const leak = rejectIfContactLeak(answer);
      if (leak) return fail(leak.message, 422, { code: leak.code });

      const { data: faq } = await supabaseAdmin
        .from("property_faqs")
        .select("id, property_id, question_text, asked_by_user_id, is_hidden")
        .eq("id", parsed.data.faqId)
        .maybeSingle();

      if (!faq || faq.is_hidden) return fail("Question not found", 404);

      const { role, tier } = await resolveAuthority(userId, faq.property_id);

      const { data: inserted, error } = await supabaseAdmin
        .from("property_faq_answers")
        .insert({
          faq_id: faq.id,
          author_id: userId,
          author_role: role,
          answer_tier: tier,
          answer_text: answer,
          // Gold answers come from the listing owner, so they are canonical
          // on arrival. Silver/bronze await Mission Control confirmation.
          is_verified: tier === "gold",
        })
        .select("id, answer_tier, author_role, created_at")
        .single();

      if (error) {
        // unique_faq_tier -- one answer per tier per question
        if (error.code === "23505") {
          return fail("This question already has an answer at your authority level. Edit your existing answer instead.", 409);
        }
        throw error;
      }

      if (faq.asked_by_user_id && faq.asked_by_user_id !== userId) {
        await notifyUser(supabaseAdmin, {
          userId: faq.asked_by_user_id,
          title: "Your question was answered",
          desc: `A ${role} answered: "${faq.question_text.slice(0, 80)}"`,
          icon: tier === "gold" ? "🥇" : tier === "silver" ? "🥈" : "🥉",
          notificationType: "faq_answered",
        });
      }

      return NextResponse.json(
        { success: true, answer: { id: inserted.id, tier: inserted.answer_tier, role: inserted.author_role } },
        { status: 201 },
      );
    }

    // ── Branch B: asking a new question ───────────────────────────────
    const parsed = askSchema.safeParse(body);
    if (!parsed.success) return fail("A question must be between 5 and 500 characters.");

    const question = stripAllTags(parsed.data.question).trim();
    if (question.length < 5) return fail("A question must be at least 5 characters.");

    const leak = rejectIfContactLeak(question);
    if (leak) return fail(leak.message, 422, { code: leak.code });

    // Rate limit: 5 questions per property per user per 24h. Cheap guard
    // against a seeker spamming an owner's listing.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("property_faqs")
      .select("id", { count: "exact", head: true })
      .eq("property_id", parsed.data.propertyId)
      .eq("asked_by_user_id", userId)
      .gte("created_at", since);

    if ((count || 0) >= 5) {
      return fail("You've reached today's question limit on this listing.", 429);
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("property_faqs")
      .insert({
        property_id: parsed.data.propertyId,
        question_text: question,
        asked_by_user_id: userId,
      })
      .select("id, question_text, created_at")
      .single();

    if (error) throw error;

    // Ping the owner so the question lands in their Mission Control queue.
    const { data: property } = await supabaseAdmin
      .from("properties")
      .select("id, title, owner_id")
      .eq("slug", parsed.data.propertyId)
      .maybeSingle();

    if (property?.owner_id && property.owner_id !== userId) {
      await notifyUser(supabaseAdmin, {
        userId: property.owner_id,
        title: "New question on your listing",
        desc: `"${question.slice(0, 80)}" — ${property.title}`,
        icon: "❓",
        propertyId: property.id,
        notificationType: "faq_question",
      });
    }

    return NextResponse.json(
      { success: true, faq: { id: inserted.id, question: inserted.question_text, createdAt: inserted.created_at, answers: [] } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/faqs] POST failed:", error);
    return fail("Failed to post. Please try again.", 500);
  }
}
