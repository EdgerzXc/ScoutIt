import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/availability?userId=123
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Auth check
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the broker's availability rules
    const { data: availability, error: availError } = await supabaseAdmin
      .from('user_availability')
      .select('weekly_schedule, date_overrides, timezone')
      .eq('user_id', targetUserId)
      .single();

    if (availError && availError.code !== 'PGRST116') {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // If no config found, return a default empty state
    const config = availability || {
      weekly_schedule: {},
      date_overrides: {},
      timezone: 'Asia/Manila'
    };

    // Also fetch their confirmed/pending appointments to block off time slots
    // Just fetch future ones
    const { data: appointments, error: apptError } = await supabaseAdmin
      .from('viewing_appointments')
      .select('scheduled_at, status')
      .eq('host_id', targetUserId)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString());

    if (apptError) {
      return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
    }

    return NextResponse.json({ config, appointments });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/availability (Update own config)
export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { weekly_schedule, date_overrides, timezone } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('user_availability')
      .upsert({
        user_id: user.id,
        weekly_schedule: weekly_schedule || {},
        date_overrides: date_overrides || {},
        timezone: timezone || 'Asia/Manila',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, availability: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
