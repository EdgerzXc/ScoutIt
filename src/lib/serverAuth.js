import { createClient } from "@supabase/supabase-js";

export async function resolveUserId(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (token && token.trim() !== "") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) return user.id;
  }
  
  if (process.env.NODE_ENV === "development") {
    const mockUser = request.headers.get("x-mock-user-id");
    if (mockUser) return mockUser;
  }

  // Dev-only fallback -- rejected in production, where identity must come
  // from a verified session token (same gate as /api/dashboard/publish).
  return null;
}
