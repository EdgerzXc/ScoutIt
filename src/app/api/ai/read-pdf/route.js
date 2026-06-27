import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';

const limiter = rateLimit({
  interval: 5 * 60 * 1000, // 5 minutes
  uniqueTokenPerInterval: 200,
});

// Extracts the real text layer from an uploaded PDF.
// The concierge flow used to call FileReader.readAsText() on the raw binary,
// which returns compressed PDF internals (garbage) — so the AI never saw the
// actual property text. This route does proper text extraction server-side.
//
// Accepts: multipart/form-data with a `file` field (a .pdf).
// Returns: { success, text, pages } or { error }.

const MAX_BYTES = 20 * 1024 * 1024; // 20MB — pitch decks/flyers are well under this

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    await limiter.check(5, ip); // 5 PDFs per 5 minutes
  } catch (error) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  try {
    // Authenticate user via JWT to prevent unauthenticated DoS on PDF parsing
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Must be a PDF.' }, { status: 415 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'PDF is too large (max 20MB).' },
        { status: 413 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });

    const cleaned = (text || '').trim();
    if (!cleaned) {
      return NextResponse.json(
        {
          error:
            'No readable text found. This PDF may be a scanned image — try a text-based PDF, or enter the listing manually.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, text: cleaned, pages: totalPages });
  } catch (err) {
    console.error('[read-pdf] extraction failed:', err);
    return NextResponse.json({ error: 'Could not read this PDF.' }, { status: 500 });
  }
}
