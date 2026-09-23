import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isOpenGateAvailable } from "@/lib/openGate";
import { normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!supabaseAdmin) return NextResponse.json({ freeContact: false }, { headers: { "Cache-Control": "no-store" } });
  const { id: slug } = await params;
  const unitId = new URL(request.url).searchParams.get("unitId");
  if (!unitId || !/^[0-9a-f-]{36}$/i.test(unitId)) return NextResponse.json({ freeContact: false }, { headers: { "Cache-Control": "no-store" } });
  const propertySelect = "id, lifecycle_state, pipeline_status";
  let propertyResult = await supabaseAdmin.from("properties").select(propertySelect).eq("canonical_slug", slug).maybeSingle();
  if (!propertyResult.data && !propertyResult.error) propertyResult = await supabaseAdmin.from("properties").select(propertySelect).eq("slug", slug).maybeSingle();
  const property = propertyResult.data;
  if (propertyResult.error || !property || normalizeLifecycleState(property) !== PROPERTY_LIFECYCLE_STATES.LIVE) {
    return NextResponse.json({ freeContact: false }, { headers: { "Cache-Control": "no-store" } });
  }
  const { data: unit, error } = await supabaseAdmin.from("property_units")
    .select("property_id, operator_id").eq("id", unitId).maybeSingle();
  const freeContact = !error && unit?.property_id === property.id && Boolean(unit?.operator_id)
    && await isOpenGateAvailable(supabaseAdmin, property.id, unit.operator_id, "operator", unitId);
  return NextResponse.json({ freeContact: freeContact === true }, { headers: { "Cache-Control": "no-store" } });
}
