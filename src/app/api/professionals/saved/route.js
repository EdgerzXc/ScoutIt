import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateSavedProfessional } from "@/lib/savedProfessional";

function unavailable() {
  return NextResponse.json({ error: "Saved professionals are not configured" }, { status: 503 });
}

export async function GET(request) {
  const userId = await resolveUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in to see saved professionals" }, { status: 401 });
  if (!supabaseAdmin) return unavailable();
  const { data, error } = await supabaseAdmin
    .from("saved_professionals")
    .select("professional_key, category, source, created_at")
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: "Could not load saved professionals" }, { status: 500 });
  return NextResponse.json({ saved: data || [] });
}

export async function POST(request) {
  const userId = await resolveUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in to save this professional" }, { status: 401 });
  if (!supabaseAdmin) return unavailable();
  const checked = validateSavedProfessional(await request.json().catch(() => ({})));
  if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });
  const { professionalKey, category, source } = checked.value;
  const { error } = await supabaseAdmin.from("saved_professionals").upsert({
    user_id: userId,
    professional_key: professionalKey,
    category,
    source,
  }, { onConflict: "user_id,professional_key" });
  if (error) return NextResponse.json({ error: "Could not save this professional" }, { status: 500 });
  return NextResponse.json({ saved: true, professionalKey });
}

export async function DELETE(request) {
  const userId = await resolveUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in to update saved professionals" }, { status: 401 });
  if (!supabaseAdmin) return unavailable();
  const checked = validateSavedProfessional(await request.json().catch(() => ({})));
  if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });
  const { error } = await supabaseAdmin
    .from("saved_professionals")
    .delete()
    .eq("user_id", userId)
    .eq("professional_key", checked.value.professionalKey);
  if (error) return NextResponse.json({ error: "Could not remove this professional" }, { status: 500 });
  return NextResponse.json({ saved: false, professionalKey: checked.value.professionalKey });
}
