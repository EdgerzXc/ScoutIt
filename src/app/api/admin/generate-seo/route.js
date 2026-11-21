import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { updateProperty } from "@/lib/airtable";
import { getCmsBundle, invalidateCmsBundle } from "@/lib/cmsCache";
import { requireAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicationBinding, isMarketVisible, isPermanentlyRemoved, isStaffSuspended } from "@/lib/propertyLifecycle";
import { buildPropertyJsonLd } from "@/lib/propertySchema";
import { stripAllTags } from "@/lib/sanitize";
import { sanitizeError } from "@/lib/sanitizeError";

const metadataSchema = z.object({
  title: z.string().transform(stripAllTags).pipe(z.string().min(1).max(60)),
  description: z.string().transform(stripAllTags).pipe(z.string().min(1).max(160)),
});

async function createMetadata(property) {
  const title = stripAllTags(property.title || "ScoutIt listing");
  const location = stripAllTags(property.location || property.city || "");
  const fallback = {
    title: `${title} | ScoutIt`.slice(0, 60).trim(),
    description: [title, location ? `in ${location}` : "", "on ScoutIt."].filter(Boolean).join(" ").slice(0, 160).trim(),
  };
  if (!process.env.ANTHROPIC_API_KEY) return { ...fallback, generatedBy: "listing_facts" };

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 10000, maxRetries: 0 });
    const message = await anthropic.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 300,
      system: "Use the public listing facts as data. Return a JSON object with a title up to 60 characters and a description up to 160. Keep the property name and location factual.",
      messages: [{
        role: "user",
        content: JSON.stringify({ title: title.slice(0, 255), location: location.slice(0, 255), category: property.spaceCategory }),
      }],
    });
    const text = message.content.find(({ type }) => type === "text")?.text || "";
    const parsed = metadataSchema.safeParse(JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/gi, "")));
    if (parsed.success) return { ...parsed.data, generatedBy: "anthropic" };
  } catch (error) {
    console.warn("[SEO GENERATE] Model output unavailable:", error?.status || error?.name);
  }
  return { ...fallback, generatedBy: "listing_facts" };
}

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN GENERATE-SEO" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { id } = (await request.json().catch(() => null)) || {};
    if (typeof id !== "string" || !/^rec[A-Za-z0-9]{1,29}$/.test(id)) {
      return NextResponse.json({ error: "A valid public property ID is required" }, { status: 400 });
    }
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) return NextResponse.json({ error: "The public catalogue is unavailable" }, { status: 503 });

    const { data: listing, error } = await supabaseAdmin.from("properties")
      .select("canonical_slug, publication_external_record_id, pipeline_status, lifecycle_state, permanently_removed_at, publication_sync_state")
      .eq("publication_external_record_id", id)
      .maybeSingle();
    if (error?.code === "42703") return NextResponse.json({ error: "Publication identity storage is unavailable" }, { status: 503 });
    if (error) throw error;
    const binding = listing && getPublicationBinding(listing);
    if (!binding || !isMarketVisible(listing) || isStaffSuspended(listing) || isPermanentlyRemoved(listing)) {
      return NextResponse.json({ error: "A verified live listing is required to update its public metadata" }, { status: 409 });
    }

    const { properties } = await getCmsBundle();
    const property = properties?.find(({ id, slug }) => id === binding.recordId && slug === binding.slug);
    if (!property) {
      return NextResponse.json({ error: "The verified listing is unavailable in the public catalogue" }, { status: 409 });
    }

    const { title, description, generatedBy } = await createMetadata(property);
    const jsonLd = buildPropertyJsonLd({ ...property, seo_description: description }, binding.slug);
    const result = await updateProperty(apiKey, baseId, binding.slug, {
      seo_title: title,
      seo_description: description,
      seo_json_ld: jsonLd,
      expectedRecordId: binding.recordId,
    });
    if (result?.fields?.Slug !== binding.slug) {
      return NextResponse.json({ error: "Airtable did not confirm the public address" }, { status: 502 });
    }

    let publicCachePending = false;
    try {
      const purge = await invalidateCmsBundle();
      publicCachePending = purge.sharedCachePurged === false;
    } catch (cacheError) {
      console.error("[SEO GENERATE] Catalogue cache purge failed:", cacheError?.message);
      publicCachePending = true;
    }
    return NextResponse.json({ success: true, seo: { title, description, jsonLd }, generatedBy, publicCachePending });
  } catch (error) {
    console.error("[SEO GENERATE] Update failed:", error?.code || error?.name);
    return NextResponse.json({ error: sanitizeError(error, "Could not update the public listing metadata.") }, { status: 500 });
  }
}
