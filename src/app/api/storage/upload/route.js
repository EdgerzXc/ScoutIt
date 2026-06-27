import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';

const limiter = rateLimit({
  interval: 10 * 60 * 1000, // 10 minutes
  uniqueTokenPerInterval: 200,
});

const TEMP_BUCKET = 'property-videos-temp';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role not configured');
  return createClient(url, key);
}

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    await limiter.check(3, ip); // 3 uploads per 10 minutes
  } catch (error) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  try {
    // Authenticate user via JWT to prevent identity spoofing
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
    const ownerId = formData.get('owner_id');
    const propertyId = formData.get('property_id') || 'pending';

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'owner_id required' }, { status: 400 });
    }
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: Cannot upload for a different user' }, { status: 403 });
    }

    // Path traversal check
    if (ownerId.includes('/') || ownerId.includes('.') || propertyId.includes('/') || propertyId.includes('.')) {
      return NextResponse.json({ error: 'Invalid owner_id or property_id format' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 500MB)' }, { status: 413 });
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: `File type .${ext} not allowed` }, { status: 415 });
    }

    const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: `MIME type ${file.type} not allowed` }, { status: 415 });
    }

    const supabase = getServiceClient();
    const timestamp = Date.now();
    const path = `${ownerId}/${propertyId}/${timestamp}.${ext}`;

    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(TEMP_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      console.error('[Storage Upload]', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Notify admin via a record in Supabase (admin checks this queue in Mission Control)
    const { error: notifyError } = await supabase
      .from('video_upload_queue')
      .insert({
        owner_id: ownerId,
        property_id: propertyId || null,
        storage_path: path,
        original_filename: file.name,
        file_size_bytes: file.size,
        status: 'pending_luma'
      });

    if (notifyError) {
      // Non-fatal — video is uploaded, just the queue record failed
      console.warn('[Storage Upload] Queue insert failed:', notifyError.message);
    }

    return NextResponse.json({
      success: true,
      path,
      message: "Video uploaded. ScoutIt team will process your Spatial Tour within 3–5 business days."
    });

  } catch (err) {
    console.error('[Storage Upload] Unexpected error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
