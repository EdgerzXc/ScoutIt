import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptUserId } from "@/lib/wishlistCrypto";

export async function POST(request) {
  try {
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

    const shareToken = encryptUserId(user.id);

    return NextResponse.json({ success: true, shareToken });
  } catch (e) {
    console.error("[SHARE API] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
