import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

    const payload = await request.json();
    const { name, role } = payload;

    if (!name || !role) {
      return NextResponse.json({ error: "Missing required profile fields" }, { status: 400 });
    }

    // SECURITY FIX: Prevent Privilege Escalation by validating allowed roles
    const allowedRoles = ['owner', 'broker', 'investor', 'tenant'];
    const safeRole = allowedRoles.includes(role) ? role : 'owner';

    if (role === 'admin' || role === 'system_admin') {
      console.warn(`[ONBOARDING API] Privilege escalation attempt detected for user ${user.id}`);
      return NextResponse.json({ error: "Invalid role specified" }, { status: 403 });
    }

    // Force secure defaults on the server
    const finalUser = {
      id: user.id,
      email: user.email,
      full_name: name,
      role: safeRole,
      subscription_tier: "free",
      connects_balance: 5,
      profile_completeness: 20
    };
    
    const { error: upsertError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(finalUser);

    if (upsertError) {
      console.error("[ONBOARDING API] Upsert Error:", upsertError);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[ONBOARDING API] Server Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
