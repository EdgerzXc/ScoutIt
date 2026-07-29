import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { notifyUser } from "@/lib/notifications";

// ─────────────────────────────────────────────────────────────────────────
// FAQ REVIEW QUEUE — owner confirm / hide  (NEW_IDEAS.md §4, final piece)
//
//   GET   /api/faqs/review
//         -> every unverified silver/bronze answer across ALL the caller's
//            listings, newest first
//
//   PATCH /api/faqs/review { answerId, action }
//         action: "confirm" | "unconfirm" | "hide" | "unhide"
//
// SECURITY BOUNDARY: the caller must own the property the answer sits on.
// This is the one endpoint that mints the "✓ Confirmed" stamp on someone
// else's words — if the ownership check leaks, anyone can put an owner's
// authority behind an arbitrary claim about a property they don't own.
// Both handlers resolve ownership from the DB; neither trusts the client.
//
// HIDE, NEVER DELETE. A wrong or abusive answer gets is_hidden = true so it
// leaves the public wall but stays auditable. Deleting user contributions
// outright destroys the record of what was claimed and when.
//
// NOTE: gold answers are deliberately NOT reviewable here. They're already
// the owner's own words, verified on arrival by /api/faqs.
// ─────────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  answerId: z.string().uuid(),
  action: z.enum(["confirm", "unconfirm", "hide", "unhide"]),
});

function fail(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

/**
 * All property slugs owned by this user. Used to scope the queue and to
 * authorise a single-answer mutation.
 */
async function ownedSlugs(userId) {
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select("slug, title")
    .eq("owner_id", userId)
    .not("slug", "is", null);

  if (error) throw error;
  return data || [];
}

// ── GET: the review queue ────────────────────────────────────────────────
export async function GET(req) {
  try {
    if (!supabaseAdmin) return fail("Server error: missing service role configuration", 500);

    const userId = await resolveUserId(req);
    if (!userId) return fail("Sign in to continue.", 401);

    // The nav badge needs the number, not 100 answers. Without this the
    // dashboard would have to pull the whole queue on every mount just to
    // render a digit.
    const countOnly = new URL(req.url).searchParams.get("countOnly") === "1";

    const properties = await ownedSlugs(userId);
    if (properties.length === 0) {
      return NextResponse.json({ success: true, items: [], pendingCount: 0 }, { status: 200 });
    }

    const slugs = properties.map((p) => p.slug);
    const titleBySlug = Object.fromEntries(properties.map((p) => [p.slug, p.title]));

    const { data: faqs, error: faqError } = await supabaseAdmin
      .from("property_faqs")
      .select("id, property_id, question_text")
      .in("property_id", slugs)
      .eq("is_hidden", false);

    if (faqError) throw faqError;
    if (!faqs?.length) {
      return NextResponse.json({ success: true, items: [], pendingCount: 0 }, { status: 200 });
    }

    const faqById = Object.fromEntries(faqs.map((f) => [f.id, f]));

    // Only silver and bronze land here — gold is the owner's own voice.
    const { data: answers, error: ansError } = await supabaseAdmin
      .from("property_faq_answers")
      .select("id, faq_id, answer_text, answer_tier, author_role, author_id, is_verified, is_hidden, created_at")
      .in("faq_id", faqs.map((f) => f.id))
      .in("answer_tier", ["silver", "bronze"])
      .order("created_at", { ascending: false })
      .limit(100);

    if (ansError) throw ansError;
    if (!answers?.length) {
      return NextResponse.json({ success: true, items: [], pendingCount: 0 }, { status: 200 });
    }

    if (countOnly) {
      return NextResponse.json(
        {
          success: true,
          items: [],
          pendingCount: answers.filter((a) => !a.is_verified && !a.is_hidden).length,
        },
        { status: 200 },
      );
    }

    // Resolve author identity in one round trip. Never expose raw user ids,
    // emails or connects_balance to the queue payload.
    const authorIds = [...new Set(answers.map((a) => a.author_id).filter(Boolean))];
    const authorById = {};
    if (authorIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name, firm, prc_verified, prc_license")
        .in("id", authorIds);
      for (const p of profiles || []) {
        authorById[p.id] = {
          name: p.display_name || "ScoutIt Member",
          firm: p.firm || null,
          prcVerified: !!p.prc_verified,
          // Presence, not the number — the owner needs to know a licence
          // exists to weigh the answer, not to read it off a queue screen.
          hasLicence: !!p.prc_license,
        };
      }
    }

    const items = answers.map((a) => {
      const faq = faqById[a.faq_id];
      return {
        answerId: a.id,
        faqId: a.faq_id,
        propertySlug: faq.property_id,
        propertyTitle: titleBySlug[faq.property_id] || faq.property_id,
        question: faq.question_text,
        answer: a.answer_text,
        tier: a.answer_tier,
        role: a.author_role,
        isVerified: a.is_verified,
        isHidden: a.is_hidden,
        answeredAt: a.created_at,
        author: authorById[a.author_id] || { name: "ScoutIt Member", firm: null, prcVerified: false, hasLicence: false },
      };
    });

    return NextResponse.json(
      {
        success: true,
        items,
        // What the badge should show: needs a decision.
        pendingCount: items.filter((i) => !i.isVerified && !i.isHidden).length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/faqs/review] GET failed:", error);
    return fail(sanitizeError(error, "Couldn't load the review queue."), 500);
  }
}

// ── PATCH: act on one answer ─────────────────────────────────────────────
export async function PATCH(req) {
  try {
    if (!supabaseAdmin) return fail("Server error: missing service role configuration", 500);

    const userId = await resolveUserId(req);
    if (!userId) return fail("Sign in to continue.", 401);

    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid review action");

    const { answerId, action } = parsed.data;

    const { data: answer, error: ansError } = await supabaseAdmin
      .from("property_faq_answers")
      .select("id, faq_id, answer_tier, author_id")
      .eq("id", answerId)
      .maybeSingle();

    if (ansError) throw ansError;
    if (!answer) return fail("Answer not found", 404);

    // Gold answers are the owner's own, already verified on arrival.
    if (answer.answer_tier === "gold") {
      return fail("Your own answers are already verified. Edit them on the listing instead.", 400);
    }

    const { data: faq, error: faqError } = await supabaseAdmin
      .from("property_faqs")
      .select("id, property_id, question_text")
      .eq("id", answer.faq_id)
      .maybeSingle();

    if (faqError) throw faqError;
    if (!faq) return fail("Question not found", 404);

    // ── THE SECURITY BOUNDARY ──────────────────────────────────────────
    const { data: property, error: propError } = await supabaseAdmin
      .from("properties")
      .select("id, owner_id, title")
      .eq("slug", faq.property_id)
      .maybeSingle();

    if (propError) throw propError;
    if (!property?.owner_id || property.owner_id !== userId) {
      return fail("Only the listing owner can review answers on it.", 403);
    }

    const patch =
      action === "confirm"   ? { is_verified: true }
      : action === "unconfirm" ? { is_verified: false }
      : action === "hide"      ? { is_hidden: true }
      :                          { is_hidden: false };

    const { error: updateError } = await supabaseAdmin
      .from("property_faq_answers")
      .update(patch)
      .eq("id", answerId);

    if (updateError) throw updateError;

    // Tell the author their answer was confirmed. Deliberately silent on
    // "hide" — a notification saying an owner hid your answer invites a
    // fight, and the owner already has the override path if they disagree.
    if (action === "confirm" && answer.author_id && answer.author_id !== userId) {
      await notifyUser(supabaseAdmin, {
        userId: answer.author_id,
        title: "Your answer was confirmed",
        desc: `The owner of "${property.title}" confirmed your answer to: "${faq.question_text.slice(0, 70)}"`,
        icon: "✓",
        propertyId: property.id,
        notificationType: "faq_verified",
      });
    }

    return NextResponse.json({ success: true, answerId, action }, { status: 200 });
  } catch (error) {
    console.error("[api/faqs/review] PATCH failed:", error);
    return fail(sanitizeError(error, "Couldn't apply that action."), 500);
  }
}
