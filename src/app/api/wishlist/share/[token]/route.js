import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { decryptUserId } from "@/lib/wishlistCrypto";

export async function GET(request, { params }) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const userId = decryptUserId(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or corrupted token" }, { status: 400 });
    }

    const { data: savedData, error: savedError } = await supabaseAdmin
      .from('saved_intel')
      .select('property_id')
      .eq('user_id', userId);

    if (savedError) {
      console.error("[SHARE GET API] Error fetching saved_intel:", savedError);
      return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
    }

    if (!savedData || savedData.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    const propertyIds = savedData.map(s => s.property_id);

    const { data: properties, error: propsError } = await supabaseAdmin
      .from('properties')
      .select('id, title, type, location, verified, media_link, price')
      .in('id', propertyIds);

    if (propsError) {
      console.error("[SHARE GET API] Error fetching properties:", propsError);
      return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
    }

    return NextResponse.json({ success: true, items: properties });
  } catch (e) {
    console.error("[SHARE GET API] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
