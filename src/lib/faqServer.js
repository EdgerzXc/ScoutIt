import { supabaseAdmin } from "./supabaseAdmin";

// ─────────────────────────────────────────────────────────────────────────
// SERVER-SIDE FAQ READ (for structured data)
//
// The property page is statically generated with ISR (revalidate = 3600).
// Calling our own /api/faqs route from the page would mean the build
// fetching from itself over HTTP, which breaks static generation. So the
// schema path reads Supabase directly instead.
//
// Best-effort by design: structured data is an enhancement. If Supabase is
// unreachable at build time we return [] and the page renders with property
// schema but no FAQPage node, rather than failing the whole route.
// ─────────────────────────────────────────────────────────────────────────

const TIER_RANK = { gold: 0, silver: 1, bronze: 2 };

/**
 * Answered FAQ threads for a property, shaped for buildFaqPageNode().
 * Unanswered questions are excluded — they can't produce a valid
 * Question/acceptedAnswer pair.
 *
 * @param {string} propertySlug - Airtable-canonical slug
 * @param {number} [limit] - max questions to embed
 * @returns {Promise<Array<{question: string, answers: Array<{text: string, tier: string}>}>>}
 */
export async function getAnsweredFaqs(propertySlug, limit = 20) {
  if (!propertySlug || !supabaseAdmin) return [];

  try {
    const { data: questions, error: qError } = await supabaseAdmin
      .from("property_faqs")
      .select("id, question_text")
      .eq("property_id", propertySlug)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (qError || !questions?.length) return [];

    const { data: answers, error: aError } = await supabaseAdmin
      .from("property_faq_answers")
      .select("faq_id, answer_text, answer_tier")
      .in("faq_id", questions.map((q) => q.id))
      .eq("is_hidden", false);

    if (aError || !answers?.length) return [];

    const byFaq = new Map();
    for (const a of answers) {
      if (!byFaq.has(a.faq_id)) byFaq.set(a.faq_id, []);
      byFaq.get(a.faq_id).push({ text: a.answer_text, tier: a.answer_tier });
    }

    return questions
      .filter((q) => byFaq.has(q.id))
      .map((q) => ({
        question: q.question_text,
        answers: byFaq
          .get(q.id)
          .sort((a, b) => (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9)),
      }));
  } catch (error) {
    console.error("[faqServer] getAnsweredFaqs failed:", error);
    return [];
  }
}

export default getAnsweredFaqs;
