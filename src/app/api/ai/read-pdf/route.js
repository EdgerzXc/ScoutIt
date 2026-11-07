import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { createClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rateLimit';
import { clientIp } from '@/lib/clientIp';
import { MAX_RAW_TEXT_CHARS, MAX_PDF_PAGES } from '@/lib/assimilateProperty';

// Extracts the real text layer from an uploaded PDF.
// The concierge flow used to call FileReader.readAsText() on the raw binary,
// which returns compressed PDF internals (garbage) — so the AI never saw the
// actual property text. This route does proper text extraction server-side.
//
// Accepts: multipart/form-data with a `file` field (a .pdf).
// Returns: { success, text, pages, totalPages, truncated } or { error }.

const MAX_BYTES = 20 * 1024 * 1024; // 20MB — pitch decks/flyers are well under this
const checkPdfRate = createRateLimiter({ limit: 20, windowMs: 60_000, maxKeys: 10_000 });

export async function POST(request) {
  try {
    const ip = clientIp(request);
    const rate = checkPdfRate(`pdf:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many PDF read requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const formData = await request.formData();

    // PDF processing is available only to a Supabase-validated account.
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const isDeclaredPdf =
      file.type === "application/pdf" ||
      file.type === "application/x-pdf" ||
      file.type === "application/octet-stream" ||
      !file.type ||
      (typeof file.name === "string" && file.name.toLowerCase().endsWith(".pdf"));

    if (!isDeclaredPdf) {
      return NextResponse.json({ error: "Invalid file type. Must be a PDF." }, { status: 415 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'PDF is too large (max 20MB).' },
        { status: 413 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    // B2 — verify it REALLY is a PDF by magic bytes, not just the declared
    // MIME (which is client-controlled and trivially spoofed).
    const { verifyFileFamily } = await import("@/lib/fileTypeCheck");
    const check = verifyFileFamily(buffer, ["application/pdf"]);
    if (!check.ok) {
      return NextResponse.json(
        { error: `Rejected: ${check.reason}` },
        { status: 415 }
      );
    }
    const pdf = await getDocumentProxy(buffer);
    const totalPages = pdf.numPages || 0;
    const cappedPages = Math.min(totalPages, MAX_PDF_PAGES);

    let rawText = "";
    if (totalPages > MAX_PDF_PAGES) {
      // Bounded server-side extraction: extract text only up to MAX_PDF_PAGES
      const texts = await Promise.all(
        Array.from({ length: cappedPages }, async (_, i) => {
          try {
            const page = await pdf.getPage(i + 1);
            const content = await page.getTextContent();
            return content.items.filter((item) => item.str != null).map((item) => item.str).join(" ");
          } catch {
            return "";
          }
        })
      );
      rawText = texts.join("\n").replace(/\s+/g, " ");
    } else {
      const extracted = await extractText(pdf, { mergePages: true });
      rawText = extracted?.text || "";
    }

    const trimmed = (rawText || '').trim();
    if (!trimmed) {
      return NextResponse.json(
        {
          error:
            'No readable text found. This PDF may be a scanned image — try a text-based PDF, or enter the listing manually.',
        },
        { status: 422 }
      );
    }

    // Enforce character ceiling to prevent cost/memory blowout
    const cleaned = trimmed.slice(0, MAX_RAW_TEXT_CHARS);
    const wasTruncated = totalPages > MAX_PDF_PAGES || trimmed.length > MAX_RAW_TEXT_CHARS;

    return NextResponse.json({
      success: true,
      text: cleaned,
      pages: cappedPages,
      totalPages,
      truncated: wasTruncated,
    });
  } catch (err) {
    console.error('[read-pdf] extraction failed:', err);
    return NextResponse.json({ error: 'Could not read this PDF.' }, { status: 500 });
  }
}
