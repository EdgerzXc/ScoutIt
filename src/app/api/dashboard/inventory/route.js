import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveUserId } from '@/lib/serverAuth';

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return the authenticated owner's property rows through the same boundary
    // used for their unit statistics. DashboardContext consumes `properties`;
    // Mission Control consumes `units` and `stats`. Keeping both here prevents
    // the private owner workspace from drifting back to a browser-side table
    // query and gives read-only E2E a real server boundary to intercept.
    const { data: userProps, error: propError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('owner_id', userId);

    if (propError) {
      console.error("propError", propError);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    const propIds = userProps.map(p => p.id);

    if (propIds.length === 0) {
      return NextResponse.json({ properties: [], units: [], stats: { total: 0, occupied: 0, vacant: 0, maintenance: 0 } }, { status: 200 });
    }

    // Now get the units
    const { data: units, error: unitError } = await supabaseAdmin
      .from('property_units')
      // `price_monthly` was here until 2026-08-06 (§58/C28). It is not a column
      // on `property_units` (the price column is `price`), so PostgREST failed
      // the whole select and this route returned 500 "Failed to fetch units" —
      // taking the entire owner inventory panel down. It was also never read:
      // the stats below only use `availability_status`. Removed rather than
      // renamed, because adding an unused column back invites the same bug.
      .select('id, property_id, availability_status')
      .in('property_id', propIds);

    if (unitError) {
      console.error("unitError", unitError);
      return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }

    // Also get saved_intel count across all property identity aliases
    // (UUID id, slug, canonical_slug, airtable_record_id) because public pages
    // store saved_intel.property_id using the public slug/record ID.
    const propIdentityMap = new Map();
    const allPropIdentifiers = new Set();
    for (const p of userProps) {
      const aliases = [
        p.id,
        p.slug,
        p.canonical_slug,
        p.airtable_record_id,
      ]
        .filter(Boolean)
        .map((val) => String(val));
      for (const alias of aliases) {
        allPropIdentifiers.add(alias);
        propIdentityMap.set(alias, p.id);
      }
    }

    const { data: savedRows, count: savedCount } = await supabaseAdmin
      .from('saved_intel')
      .select('property_id', { count: 'exact' })
      .in('property_id', Array.from(allPropIdentifiers));

    const savedCountsByPropId = new Map();
    if (Array.isArray(savedRows)) {
      for (const row of savedRows) {
        const canonicalPropId = propIdentityMap.get(String(row?.property_id || ''));
        if (canonicalPropId) {
          savedCountsByPropId.set(
            canonicalPropId,
            (savedCountsByPropId.get(canonicalPropId) || 0) + 1
          );
        }
      }
    }

    const enrichedProps = userProps.map((p) => ({
      ...p,
      saved_count: savedCountsByPropId.get(p.id) || 0,
    }));

    const resolvedSavedCount =
      typeof savedCount === 'number'
        ? savedCount
        : Array.isArray(savedRows)
          ? savedRows.length
          : 0;

    // Calculate stats
    let total = 0;
    let occupied = 0;
    let vacant = 0;
    let maintenance = 0;

    (units || []).forEach(unit => {
      total++;
      if (unit.availability_status === 'occupied') occupied++;
      else if (unit.availability_status === 'maintenance') maintenance++;
      else vacant++; // default/available
    });

    return NextResponse.json({
      properties: enrichedProps,
      units, 
      stats: { total, occupied, vacant, maintenance, saved_intel_count: resolvedSavedCount } 
    }, { status: 200 });

  } catch (error) {
    console.error("Inventory API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
