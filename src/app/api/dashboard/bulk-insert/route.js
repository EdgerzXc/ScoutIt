import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { properties } = await request.json();

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return NextResponse.json({ error: "Invalid properties array" }, { status: 400 });
    }

    // Attempt to bulk insert into Supabase
    // Using a single insert call avoids overwhelming the DB with 1000s of requests
    const { data, error } = await supabase
      .from('properties')
      .insert(properties)
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
