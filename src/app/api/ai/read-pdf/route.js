import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';

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
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
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
