"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, logAction, TIERS } from "@/lib/rbac";
import {
  pushBriefingToAirtable,
  publishedMarkers,
  setArticleLiveStateInAirtable,
  fetchAirtableIntelRecord,
} from "@/lib/intelPublish";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";

/**
 * Validates that an article has required core fields and a clean URL-safe slug.
 */
function validateArticleInput(data) {
  if (!data?.title || typeof data.title !== "string" || !data.title.trim()) {
    throw new Error("Article title is required.");
  }
  if (!data?.slug || typeof data.slug !== "string" || !data.slug.trim()) {
    throw new Error("Article slug is required.");
  }
  const cleanSlug = data.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleanSlug) {
    throw new Error("Article slug must contain at least one alphanumeric character.");
  }

  return cleanSlug;
}

/**
 * Loads articles from Supabase intel_briefings with optional status and search filtering.
 * Cross-references with Airtable INTEL_CMS for live site status where synced.
 */
export async function loadArticles({ status = "all", search = "", limit = 50 } = {}) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const admin = createAdminClient();
  let query = admin
    .from("intel_briefings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status === "draft") {
    query = query.eq("published_to_airtable", false);
  } else if (status === "synced") {
    query = query.eq("published_to_airtable", true);
  }

  if (search && typeof search === "string" && search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const { data: articles, error } = await query;
  if (error) {
    return { ok: false, error: error.message, articles: [] };
  }

  // Cross-reference live state with Airtable if credentials exist
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  const enriched = await Promise.all(
    (articles || []).map(async (art) => {
      let liveOnSite = false;
      if (apiKey && baseId && art.airtable_record_id) {
        try {
          const airtableRec = await fetchAirtableIntelRecord(apiKey, baseId, art.airtable_record_id);
          liveOnSite = Boolean(airtableRec?.fields?.Approved_For_Live_Site);
        } catch {
          liveOnSite = false;
        }
      }
      return {
        ...art,
        live_on_site: liveOnSite,
      };
    })
  );

  return { ok: true, articles: enriched };
}

/**
 * Save or update an article draft in Supabase.
 * Enforces strict honesty: missing location or sources are stored as empty/null,
 * never defaulted to invented BGC coordinates or "OSINT Gazette".
 */
export async function saveArticle(articleData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const cleanSlug = validateArticleInput(articleData);

  // Parse body_json
  let bodyJson = [];
  if (Array.isArray(articleData.body_json)) {
    bodyJson = articleData.body_json;
  } else if (typeof articleData.body_json === "string" && articleData.body_json.trim()) {
    try {
      bodyJson = JSON.parse(articleData.body_json);
    } catch {
      // If plain text was entered, convert to a single paragraph block
      bodyJson = [{ type: "paragraph", text: articleData.body_json.trim() }];
    }
  }

  const nowIso = new Date().toISOString();
  const payload = {
    title: articleData.title.trim(),
    slug: cleanSlug,
    category: articleData.category?.trim() || "MARKET INTEL",
    excerpt: articleData.excerpt?.trim() || "",
    lead: articleData.lead?.trim() || "",
    our_take: articleData.our_take?.trim() || "",
    cover_image_url: articleData.cover_image_url?.trim() || "",
    body_json: bodyJson,
    // Honest values — refuse invented defaults
    city: articleData.city?.trim() || "",
    region: articleData.region?.trim() || "",
    lat: typeof articleData.lat === "number" && Number.isFinite(articleData.lat) ? articleData.lat : null,
    lng: typeof articleData.lng === "number" && Number.isFinite(articleData.lng) ? articleData.lng : null,
    source_name: articleData.source_name?.trim() || "",
    source_url: articleData.source_url?.trim() || "",
    updated_at: nowIso,
  };

  const admin = createAdminClient();
  let articleId = articleData.id;
  let savedArticle = null;

  if (articleId) {
    const { data, error } = await admin
      .from("intel_briefings")
      .update(payload)
      .eq("id", articleId)
      .select("*")
      .single();

    if (error) throw new Error(`Failed to update article: ${error.message}`);
    savedArticle = data;

    await logAction({
      staff,
      action: "article.update",
      targetTable: "intel_briefings",
      targetId: articleId,
      metadata: { title: payload.title, slug: payload.slug },
    });
  } else {
    payload.created_at = nowIso;
    payload.published_to_airtable = false;

    const { data, error } = await admin
      .from("intel_briefings")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw new Error(`Failed to create article: ${error.message}`);
    savedArticle = data;
    articleId = data.id;

    await logAction({
      staff,
      action: "article.create",
      targetTable: "intel_briefings",
      targetId: articleId,
      metadata: { title: payload.title, slug: payload.slug },
    });
  }

  revalidatePath("/dashboard/articles");
  return { ok: true, article: savedArticle };
}

/**
 * Pushes a draft article from Supabase into Airtable INTEL_CMS.
 * Initially creates the record with Approved_For_Live_Site: false for human editorial review.
 */
export async function syncArticleToAirtable(articleId) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!articleId) throw new Error("Missing articleId");

  const admin = createAdminClient();
  const { data: briefing, error } = await admin
    .from("intel_briefings")
    .select("*")
    .eq("id", articleId)
    .single();

  if (error || !briefing) {
    throw new Error(error?.message || "Article draft not found.");
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("Missing Airtable API credentials.");
  }

  let syncResult;
  try {
    syncResult = await pushBriefingToAirtable({
      apiKey,
      baseId,
      briefing,
    });
  } catch (err) {
    await recordSystemEvent({
      event: EVENTS.AIRTABLE_PUBLISH_FAILED,
      severity: "error",
      subjectTable: "intel_briefings",
      subjectId: articleId,
      summary: `Airtable intel sync failed: ${err.message}`,
      detail: { slug: briefing.slug, error: err.message },
    });
    throw err;
  }

  const markers = publishedMarkers(syncResult.recordId);
  const { error: updateError } = await admin
    .from("intel_briefings")
    .update(markers)
    .eq("id", articleId);

  if (updateError) {
    throw new Error(`Synced to Airtable (${syncResult.recordId}) but failed to update Supabase: ${updateError.message}`);
  }

  await recordSystemEvent({
    event: EVENTS.AIRTABLE_PUBLISH_OK,
    severity: syncResult.cache?.purged ? "info" : "warning",
    subjectTable: "intel_briefings",
    subjectId: articleId,
    summary: `Synced article '${briefing.slug}' to Airtable INTEL_CMS (${syncResult.created ? "created" : "updated"})`,
    detail: { recordId: syncResult.recordId, slug: briefing.slug },
  });

  await logAction({
    staff,
    action: "article.sync_airtable",
    targetTable: "intel_briefings",
    targetId: articleId,
    metadata: { recordId: syncResult.recordId, slug: briefing.slug },
  });

  revalidatePath("/dashboard/articles");
  return { ok: true, recordId: syncResult.recordId };
}

/**
 * Toggles the public live site status (Approved_For_Live_Site) on Airtable INTEL_CMS.
 * Purges the public catalogue Redis cache immediately so changes reflect instantly.
 */
export async function setArticleLiveState(articleId, isLive) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!articleId) throw new Error("Missing articleId");

  const admin = createAdminClient();
  const { data: briefing, error } = await admin
    .from("intel_briefings")
    .select("*")
    .eq("id", articleId)
    .single();

  if (error || !briefing) {
    throw new Error(error?.message || "Article not found.");
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("Missing Airtable API credentials.");
  }

  let recordId = briefing.airtable_record_id;

  // If article has not been synced to Airtable yet, sync it first
  if (!recordId) {
    const syncRes = await pushBriefingToAirtable({ apiKey, baseId, briefing });
    recordId = syncRes.recordId;
    await admin.from("intel_briefings").update(publishedMarkers(recordId)).eq("id", articleId);
  }

  const liveResult = await setArticleLiveStateInAirtable({
    apiKey,
    baseId,
    recordId,
    isLive: Boolean(isLive),
  });

  await admin
    .from("intel_briefings")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", articleId);

  await recordSystemEvent({
    event: EVENTS.AIRTABLE_PUBLISH_OK,
    severity: "info",
    subjectTable: "intel_briefings",
    subjectId: articleId,
    summary: Boolean(isLive)
      ? `Article '${briefing.slug}' is now APPROVED FOR LIVE SITE on ScoutIt`
      : `Article '${briefing.slug}' was RETRACTED / TAKEN DOWN from ScoutIt live site`,
    detail: { recordId, isLive: Boolean(isLive), slug: briefing.slug },
  });

  await logAction({
    staff,
    action: Boolean(isLive) ? "article.go_live" : "article.take_down",
    targetTable: "intel_briefings",
    targetId: articleId,
    metadata: { recordId, isLive: Boolean(isLive), slug: briefing.slug },
  });

  revalidatePath("/dashboard/articles");
  return { ok: true, isLive: Boolean(isLive), recordId };
}

/**
 * Delete an article draft from Supabase if it is not live.
 */
export async function deleteArticle(articleId) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!articleId) throw new Error("Missing articleId");

  const admin = createAdminClient();
  const { data: briefing, error: fetchErr } = await admin
    .from("intel_briefings")
    .select("id, title, slug, airtable_record_id")
    .eq("id", articleId)
    .single();

  if (fetchErr || !briefing) {
    throw new Error(fetchErr?.message || "Article not found.");
  }

  // Check if article is currently live on Airtable before deleting
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (apiKey && baseId && briefing.airtable_record_id) {
    const airtableRec = await fetchAirtableIntelRecord(apiKey, baseId, briefing.airtable_record_id);
    if (airtableRec?.fields?.Approved_For_Live_Site) {
      throw new Error("Cannot delete an article that is currently live. Take it down first.");
    }
  }

  const { error: deleteErr } = await admin
    .from("intel_briefings")
    .delete()
    .eq("id", articleId);

  if (deleteErr) throw new Error(`Failed to delete article: ${deleteErr.message}`);

  await logAction({
    staff,
    action: "article.delete",
    targetTable: "intel_briefings",
    targetId: articleId,
    metadata: { title: briefing.title, slug: briefing.slug },
  });

  revalidatePath("/dashboard/articles");
  return { ok: true };
}
