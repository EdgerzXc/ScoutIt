import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { stripAllTags } from "@/lib/sanitize";
import { MAX_PROPERTY_CSV_BYTES, MAX_PROPERTY_CSV_ROWS } from "@/lib/propertyCsvImport";

const MAX_BATCH_SIZE = MAX_PROPERTY_CSV_ROWS;
const CSV_FORMULA_PREFIX_RE = /^[=+\-@\t\r]+/;

export function sanitizeCsvFormulaValue(value) {
  return stripAllTags(value).replace(CSV_FORMULA_PREFIX_RE, "").trim();
}

const requiredText = (limit) => z.string().max(limit).transform(sanitizeCsvFormulaValue).pipe(z.string().min(1));
const optionalText = (limit) => z.string().max(limit).transform(sanitizeCsvFormulaValue).optional();
const propertySchema = z.object({
  title: requiredText(255),
  location: requiredText(255),
  type: requiredText(100),
  space_category: optionalText(100),
  description: z.string().max(5000).transform((value) => value.split(/\r?\n/).map(sanitizeCsvFormulaValue).join("\n")).optional(),
  media_link: z.string().max(2048).trim().refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Enter an HTTP or HTTPS image URL.").optional(),
  price: z.union([z.number(), z.string().max(64), z.null()]).optional().transform((value, ctx) => {
    if (value == null || value === "") return null;
    if (typeof value === "number") {
      if (!Number.isFinite(value) || value < 0) {
        ctx.addIssue({ code: "custom", message: "Enter a price as a non-negative number." });
        return z.NEVER;
      }
      return value;
    }
    const amount = String(value)
      .trim()
      .replace(/^(?:php|₱)\s*/i, "")
      .replace(/(?:\s*\/\s*(?:sqm|sq\.?\s*m|mo|month|yr|year|night|day|hr|hour))+$/i, "")
      .replaceAll(",", "")
      .trim();
    if (!/^\d+(?:\.\d+)?$/.test(amount) || !Number.isFinite(Number(amount))) {
      ctx.addIssue({ code: "custom", message: "Enter a price as a non-negative number." });
      return z.NEVER;
    }
    return Number(amount);
  }),
  details: z.object({
    beds: optionalText(50),
    baths: optionalText(50),
    floor_sqm: optionalText(100),
    furnishing: optionalText(120),
    handOver: optionalText(120),
    layout: optionalText(255),
    layouts: optionalText(255),
    RST_Seating_Capacity: optionalText(50),
    RST_Hood_Exhaust: optionalText(100),
    RST_Liquor_License: optionalText(100),
    HOSP_Room_Count: optionalText(50),
    HOSP_Star_Rating: optionalText(50),
    STR_Nightly_Rate: optionalText(50),
    STR_Max_Guests: optionalText(50),
    VEN_Capacity_Seated: optionalText(50),
    VEN_Capacity_Standing: optionalText(50),
    CM_Total_GLA: optionalText(100),
    PEZA: optionalText(120),
  }).optional(),
});

function draftId(ownerId, importId, index) {
  const hex = createHash("sha256").update(JSON.stringify(["scoutit-property-csv-v1", ownerId, importId, index])).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function readImportBody(request) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return body + decoder.decode();
      size += value.byteLength;
      if (size > MAX_PROPERTY_CSV_BYTES) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Sign in to import property drafts." }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Property import is temporarily unavailable." }, { status: 503 });

    const raw = await readImportBody(request);
    if (raw === null) {
      return NextResponse.json({ error: "The import is too large. Use a smaller CSV." }, { status: 413 });
    }
    let body;
    try { body = JSON.parse(raw); } catch {
      return NextResponse.json({ error: "Invalid import request." }, { status: 400 });
    }
    const { properties, importId } = body || {};
    if (!Array.isArray(properties) || !properties.length || !z.uuid().safeParse(importId).success) {
      return NextResponse.json({ error: "An import ID and at least one property are required." }, { status: 400 });
    }
    if (properties.length > MAX_BATCH_SIZE) {
      return NextResponse.json({ error: `Import up to ${MAX_BATCH_SIZE} rows at a time.`, code: "BATCH_LIMIT_EXCEEDED" }, { status: 413 });
    }

    const parsed = z.array(propertySchema).safeParse(properties);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const [index, field] = issue.path;
      return NextResponse.json({
        error: `Check ${String(field || "the fields")} on row ${index + 1}.`,
      }, { status: 400 });
    }

    const rows = parsed.data.map((property, index) => {
      const normalizedDetails = property.details ? { ...property.details } : {};
      if (normalizedDetails.layout !== undefined) {
        if (normalizedDetails.layouts === undefined) {
          normalizedDetails.layouts = normalizedDetails.layout;
        }
        delete normalizedDetails.layout;
      }
      return {
        ...property,
        id: draftId(userId, importId.toLowerCase(), index),
        owner_id: userId,
        space_category: property.space_category || property.type,
        details: normalizedDetails,
        price: property.price ?? null,
        creation_source: "csv",
        pipeline_status: "draft",
        lifecycle_state: "draft",
        moderation_status: "pending",
      };
    });

    const { error } = await supabaseAdmin.from("properties").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
    const { data: inserted, error: readError } = await supabaseAdmin.from("properties").select("*")
      .eq("owner_id", userId).in("id", rows.map(({ id }) => id));
    if (readError) throw readError;
    if (inserted?.length !== rows.length) {
      return NextResponse.json({ error: "Couldn't confirm all drafts for this import." }, { status: 409 });
    }
    return NextResponse.json({ success: true, count: inserted.length, inserted });
  } catch (error) {
    console.error("[BULK INSERT] Could not confirm import:", error?.code || error?.name);
    return NextResponse.json({ error: "Couldn't confirm the import. Retry to check for saved drafts." }, { status: 503 });
  }
}
