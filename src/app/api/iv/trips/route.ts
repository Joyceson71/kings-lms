import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

async function handleGET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: trips, error } = await supabase
      .from('iv_trips')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ trips }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handlePOST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    
    // Check if user is faculty or admin
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['faculty', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, map_bounds, trip_code: customCode } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }

    // Use client provided code or auto-generate
    const trip_code = customCode || crypto.randomBytes(3).toString('hex').toUpperCase();

    const { data: newTrip, error: insertError } = await serviceClient
      .from('iv_trips')
      .insert({
        name,
        trip_code,
        created_by: user.id,
        map_bounds,
        active: true
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ trip: newTrip }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = withApiHandler(handleGET, { route: '/api/iv/trips GET', auth: true, querySchema: z.object({}).passthrough() });
export const POST = withApiHandler(handlePOST, { route: '/api/iv/trips POST', auth: true, bodySchema: z.object({ name: z.string().trim().min(1), map_bounds: z.unknown().optional(), trip_code: z.string().optional() }) });
