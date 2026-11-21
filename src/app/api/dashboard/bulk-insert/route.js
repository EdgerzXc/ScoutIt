import { NextResponse } from 'next/server';
import { getVerifiedWorkspaceUser } from "@/lib/workspaceRequestAuth";
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from "zod";
import { stripAllTags } from "@/lib/sanitize";
import { sanitizeError } from "@/lib/sanitizeError";

const MAX_BATCH_SIZE = 100;
const CSV_FORMULA_PREFIX_RE = /^[=+\-@\t\r]+/;

export function sanitizeCsvFormulaValue(value) {
  const stripped = stripAllTags(value);
  return stripped.trimStart().replace(CSV_FORMULA_PREFIX_RE, "");
}

const csvText = (limit) => z.string().max(limit).transform(sanitizeCsvFormulaValue);

const propertySchema = z.object({
  title: csvText(255).optional(),
  type: csvText(100).optional(),
  space_category: csvText(100).optional(),
  location: csvText(255).optional(),
  description: csvText(5000).optional(),
  media_link: z.string().trim().max(2048).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }).optional(),
  price: z.union([z.number(), z.string().max(64), z.null()]).optional().transform((value, ctx) => {
    if (value == null || (typeof value === "string" && !value.trim())) return null;
    const normalized = typeof value === "string"
      ? value.trim().replace(/^(?:₱|PHP)\s*/i, "").replaceAll(",", "")
      : null;
    const amount = normalized === null ? value : /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
    if (!Number.isFinite(amount) || amount < 0) {
      ctx.addIssue({ code: "custom", message: "Price must be a non-negative number." });
      return z.NEVER;
    }
    return amount;
  }),
  details: z.record(z.string().max(120), z.union([csvText(5000), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = /^Bearer\s+(.+)$/i.exec(authHeader || "")?.[1]?.trim();
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await getVerifiedWorkspaceUser(authClient, token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const userId = user.id;

    const body = await request.json().catch(() => null);
    const properties = body?.properties;

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return NextResponse.json({ error: "Invalid properties array" }, { status: 400 });
    }

    if (properties.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          error: `Batch size exceeds maximum limit of ${MAX_BATCH_SIZE} rows per request.`,
          code: "BATCH_LIMIT_EXCEEDED",
        },
        { status: 413 }
      );
    }

    // Validate the array shape
    const validationResult = z.array(propertySchema).safeParse(properties);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid array data format" }, { status: 400 });
    }

    const verifiedProperties = validationResult.data.map((property) => ({
      ...property,
      owner_id: userId,
      pipeline_status: "pending",
      lifecycle_state: "draft",
      moderation_status: "pending",
      canonical_slug: null,
    }));

    // Attempt to bulk insert into Supabase
    // Using admin client because user may be uploading 1000s of properties.
    const { data, error } = await supabaseAdmin
      .from('properties')
      .insert(verifiedProperties)
      .select();

    if (error) {
      console.error("[BULK INSERT] Supabase error:", error);
      return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length, inserted: data });

  } catch (err) {
    console.error("[BULK INSERT] Internal Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
