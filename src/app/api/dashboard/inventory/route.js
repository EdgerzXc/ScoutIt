import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSession } from '@/lib/authClient';

export async function GET(request) {
  try {
    const { data: { session } } = await getSession();
    
    // Auth Check
    let userId = session?.user?.id;
    
    // Fallback for dev mocks
    if (!userId) {
      const mockId = request.headers.get("x-mock-user-id");
      if (mockId) userId = mockId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the user's properties to filter units
    const { data: userProps, error: propError } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('owner_id', userId);

    if (propError) {
      console.error("propError", propError);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    const propIds = userProps.map(p => p.id);

    if (propIds.length === 0) {
      return NextResponse.json({ units: [], stats: { total: 0, occupied: 0, vacant: 0, maintenance: 0 } }, { status: 200 });
    }

    // Now get the units
    const { data: units, error: unitError } = await supabaseAdmin
      .from('property_units')
      .select('id, property_id, availability_status, price_monthly')
      .in('property_id', propIds);

    if (unitError) {
      console.error("unitError", unitError);
      return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }

    // Also get saved_intel count
    const { count: savedCount, error: savedError } = await supabaseAdmin
      .from('saved_intel')
      .select('*', { count: 'exact', head: true })
      .in('property_id', propIds);

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
      units, 
      stats: { total, occupied, vacant, maintenance, saved_intel_count: savedCount || 0 } 
    }, { status: 200 });

  } catch (error) {
    console.error("Inventory API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
