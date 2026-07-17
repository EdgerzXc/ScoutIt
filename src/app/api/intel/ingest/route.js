import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL } from "@/lib/geminiModel";
import {
  ingestedArticleSchema,
  articleBlocksSchema,
  blocksFromPlainText,
  blocksFromTableRows,
  blocksToPlainText,
  slugifyTitle,
} from "@/lib/articleSchema";

// ═══════════════════════════════════════════════════════════════
// INTEL INGEST — upload any document, get a readable Intel article.
//
// Accepts multipart/form-data:
//   file       — .pdf | .csv | .txt | .md   (or omit and send `text`)
//   text       — pasted raw text (alternative to file)
//   publish    — "true" checks Approved_For_Live_Site immediately
//   mockOwnerId— dev-sandbox bypass (non-production only)
//
// Pipeline: extract text/rows → structure into the universal block
// schema (Gemini when GEMINI_API_KEY is set, deterministic parser
// otherwise) → create an INTEL_CMS record with Body_JSON.
// Airtable stays the single public CMS (Dual-CMS Golden Rule).
// ═══════════════════════════════════════════════════════════════

const MAX_BYTES = 20 * 1024 * 1024; // matches /api/ai/read-pdf
const AIRTABLE_API = "https://api.airtable.com/v0";

const STRUCTURE_PROMPT = `
You are the editorial engine for ScoutIt, a Philippine real estate intelligence platform.
Convert the raw document below into a clean, readable market-intel article using ScoutIt's universal block schema.

RULES (non-negotiable):
1. Use ONLY facts present in the document. Never invent numbers, quotes, or claims.
2. Keep the author's meaning; you may reorganize for readability.
3. Prefer short paragraphs. Pull key figures into "stat" blocks. Preserve tabular data as "table" blocks.
4. category must be one of: Residential, Commercial, STR, Hospitality, Restaurants, Venues, General.
5. intelType must be one of: BRIEFING, MARKET INTEL, AREA GUIDE, COMMERCIAL SIGNAL, INSIGHT.
6. "lead" is a one-sentence editorial hook. "excerpt" is a 1-2 sentence summary for cards.
7. "recommendation" is a practical takeaway for a property buyer/investor, grounded in the document. If the document supports none, return an empty string.

Block types allowed:
  {"type":"heading","level":2|3,"text":string}
  {"type":"paragraph","text":string}
  {"type":"quote","text":string,"cite":string?}
  {"type":"list","style":"bullet"|"number","items":[string]}
  {"type":"table","headers":[string],"rows":[[string]]}
  {"type":"stat","label":string,"value":string,"detail":string?}
  {"type":"callout","label":string?,"text":string}
  {"type":"divider"}
`;

async function authenticate(request, formData) {
  const mockOwnerId = formData.get("mockOwnerId");
  const isDevMock = process.env.NODE_ENV !== "production" && mockOwnerId === "master-dev";
  if (isDevMock) return { ok: true };

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return { ok: false, error: "Unauthorized: Missing token" };

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return { ok: false, error: "Unauthorized: Invalid session" };
  return { ok: true, user };
}

async function extractSource(file, pastedText) {
  if (pastedText && pastedText.trim().length > 0) {
    return { kind: "text", text: pastedText.trim(), name: "Pasted text" };
  }
  if (!file || typeof file.arrayBuffer !== "function") {
    return { error: "No file or text provided." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File is too large (max 20MB)." };
  }

  const name = file.name || "document";
  const lower = name.toLowerCase();

  if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    const cleaned = (text || "").trim();
    if (!cleaned) return { error: "No readable text found — this PDF may be a scanned image." };
    return { kind: "text", text: cleaned, name };
  }

  if (lower.endsWith(".csv") || file.type === "text/csv") {
    const raw = await file.text();
    const parsed = Papa.parse(raw.trim(), { skipEmptyLines: true });
    if (!parsed.data || parsed.data.length < 2) {
      return { error: "This spreadsheet has no readable rows. Export it as CSV with a header row." };
    }
    return { kind: "table", rows: parsed.data, name };
  }

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return { error: "Excel files aren't read directly yet — save the sheet as CSV (File → Save As → CSV) and upload that." };
  }

  if (lower.endsWith(".txt") || lower.endsWith(".md") || (file.type || "").startsWith("text/")) {
    const text = (await file.text()).trim();
    if (!text) return { error: "The file is empty." };
    return { kind: "text", text, name };
  }

  return { error: `Unsupported file type: ${name}. Upload a PDF, CSV, TXT, or Markdown file.` };
}

// Deterministic no-AI article: still produces a fully readable result.
function fallbackArticle(source) {
  const baseTitle = source.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim() || "Intel Briefing";
  const blocks = source.kind === "table"
    ? blocksFromTableRows(source.rows)
    : blocksFromPlainText(source.text);
  return {
    title: baseTitle.charAt(0).toUpperCase() + baseTitle.slice(1),
    slug: slugifyTitle(baseTitle),
    category: "General",
    intelType: "BRIEFING",
    city: "",
    excerpt: blocksToPlainText(blocks, 200),
    lead: "",
    recommendation: "",
    blocks,
  };
}

async function structureWithGemini(source) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const docText = source.kind === "table"
    ? `CSV DATA (first row is headers):\n${Papa.unparse(source.rows.slice(0, 120))}`
    : source.text.slice(0, 60000);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `${STRUCTURE_PROMPT}\n\nDocument filename: ${source.name}\n\nRAW DOCUMENT:\n${docText}\n\nReturn one JSON object: {title, category, intelType, city, excerpt, lead, recommendation, blocks}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title:          { type: Type.STRING },
          category:       { type: Type.STRING },
          intelType:      { type: Type.STRING },
          city:           { type: Type.STRING, nullable: true },
          excerpt:        { type: Type.STRING },
          lead:           { type: Type.STRING },
          recommendation: { type: Type.STRING, nullable: true },
          blocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type:    { type: Type.STRING },
                level:   { type: Type.NUMBER, nullable: true },
                text:    { type: Type.STRING, nullable: true },
                cite:    { type: Type.STRING, nullable: true },
                style:   { type: Type.STRING, nullable: true },
                items:   { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                headers: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                rows:    { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } }, nullable: true },
                label:   { type: Type.STRING, nullable: true },
                value:   { type: Type.STRING, nullable: true },
                detail:  { type: Type.STRING, nullable: true },
              },
            },
          },
        },
      },
    },
  });

  const raw = JSON.parse(response.text);
  // Strip nulls Gemini pads optional fields with, then validate hard.
  const cleanedBlocks = (raw.blocks || []).map((b) =>
    Object.fromEntries(Object.entries(b).filter(([, v]) => v !== null && v !== undefined))
  );
  const blocksResult = articleBlocksSchema.safeParse(cleanedBlocks);
  const candidate = {
    title: raw.title || source.name,
    slug: slugifyTitle(raw.title || source.name),
    category: raw.category,
    intelType: raw.intelType,
    city: raw.city || "",
    excerpt: raw.excerpt || "",
    lead: raw.lead || "",
    recommendation: raw.recommendation || "",
    blocks: blocksResult.success ? blocksResult.data : null,
  };
  if (!candidate.blocks) throw new Error("Gemini returned blocks that failed schema validation");
  const validated = ingestedArticleSchema.safeParse(candidate);
  if (!validated.success) {
    // Salvage: keep the validated blocks, normalize the envelope.
    return ingestedArticleSchema.parse({ ...fallbackArticle(source), title: candidate.title, slug: candidate.slug, blocks: candidate.blocks });
  }
  return validated.data;
}

async function createIntelRecord(article, publish) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    return { error: "Airtable credentials are not configured on this server." };
  }

  const res = await fetch(`${AIRTABLE_API}/${baseId}/INTEL_CMS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Title: article.title,
            Slug: article.slug,
            SpaceCategory: article.category === "General" ? undefined : article.category,
            IntelType: article.intelType,
            Date: new Date().toISOString().slice(0, 10),
            City: article.city || undefined,
            Excerpt: article.excerpt || undefined,
            Lead: article.lead || undefined,
            Recommendation: article.recommendation || undefined,
            Body_JSON: JSON.stringify(article.blocks),
            Approved_For_Live_Site: !!publish,
          },
        },
      ],
      typecast: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[Intel Ingest] Airtable create failed:", detail);
    return { error: "Could not save the article to the CMS." };
  }
  const data = await res.json();
  return { record: data.records?.[0] };
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const auth = await authenticate(request, formData);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const source = await extractSource(formData.get("file"), formData.get("text"));
    if (source.error) {
      return NextResponse.json({ error: source.error }, { status: 422 });
    }

    let article;
    let engine = "fallback";
    if (process.env.GEMINI_API_KEY) {
      try {
        article = await structureWithGemini(source);
        engine = "gemini";
      } catch (aiErr) {
        console.error("[Intel Ingest] Gemini structuring failed, using fallback:", aiErr.message);
        article = fallbackArticle(source);
      }
    } else {
      console.warn("[Intel Ingest] No GEMINI_API_KEY — using deterministic parser");
      article = fallbackArticle(source);
    }

    // Preview-only mode: return the structured article without saving.
    if (formData.get("previewOnly") === "true") {
      return NextResponse.json({ success: true, engine, article });
    }

    const publish = formData.get("publish") === "true";
    const saved = await createIntelRecord(article, publish);
    if (saved.error) {
      return NextResponse.json({ error: saved.error, article }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      engine,
      article,
      recordId: saved.record?.id,
      published: publish,
      url: `/intel/${article.slug}`,
    });
  } catch (err) {
    console.error("[Intel Ingest] Error:", err);
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
