import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const propertySchema = z.object({
  title: z.string().max(255).optional(),
  type: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  details: z.record(z.any()).optional()
}).passthrough(); // allows other fields since it's a dynamic CSV upload

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header
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

    const userId = user.id;

    const { properties } = await request.json();

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return NextResponse.json({ error: "Invalid properties array" }, { status: 400 });
    }

    // Validate the array shape
    const validationResult = z.array(propertySchema).safeParse(properties);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid array data format" }, { status: 400 });
    }

    const validatedProperties = validationResult.data;

    // Inject verified user id and sanitize
    const verifiedProperties = validatedProperties.map(p => {
      const sanitized = {};
      for (const [key, val] of Object.entries(p)) {
        if (typeof val === 'string') {
          sanitized[DOMPurify.sanitize(key)] = DOMPurify.sanitize(val);
        } else {
          sanitized[DOMPurify.sanitize(key)] = val;
        }
      }
      return {
        ...sanitized,
        owner_id: userId
      };
    });

    // Attempt to bulk insert into Supabase
    // Using admin client because user may be uploading 1000s of properties.
    const { data, error } = await supabaseAdmin
      .from('properties')
      .insert(verifiedProperties)
      .select();

    if (error) {
      console.error("[BULK INSERT] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length, inserted: data });

  } catch (err) {
    console.error("[BULK INSERT] Internal Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
