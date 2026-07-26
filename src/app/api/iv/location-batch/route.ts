import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pings } = await request.json();

    if (!Array.isArray(pings) || pings.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Ensure users only upsert their own location, though RLS protects it anyway
    const safePings = pings.map(p => ({
      ...p,
      user_id: user.id
    }));

    const { error } = await supabase
      .from('iv_locations')
      .upsert(safePings, { onConflict: 'user_id,iv_trip_id' });

    if (error) {
      console.error('location-batch error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
