import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { checkRateLimit } from '@/lib/utils/rate-limit';

if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function handlePOST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(`broadcast:${user.id}`, { limit: 5, windowMs: 60_000 });
    if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many broadcasts. Please wait before retrying.' }, { status: 429 });

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

    const { iv_trip_id, message, gather_lat, gather_lng } = await request.json();

    if (!iv_trip_id || !message) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Insert into iv_alerts table
    const { error: alertError } = await serviceClient
      .from('iv_alerts')
      .insert({
        iv_trip_id,
        sent_by: user.id,
        message,
        gather_lat,
        gather_lng
      });

    if (alertError) {
      throw alertError;
    }

    // 2. Fetch all push_subscriptions for users in the trip
    // First, find users who are in this trip (based on iv_locations)
    const { data: locations } = await serviceClient
      .from('iv_locations')
      .select('user_id')
      .eq('iv_trip_id', iv_trip_id);

    if (!locations || locations.length === 0) {
      return NextResponse.json({ sent: 0 }, { status: 200 });
    }

    const userIds = Array.from(new Set(locations.map(loc => loc.user_id)));

    // Fetch push subscriptions
    const { data: subs } = await serviceClient
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', userIds);

    let sent = 0;
    if (subs && subs.length > 0) {
      // 3. Call web-push sendNotification() for each subscription
      const payload = JSON.stringify({
        title: 'Kings IV Alert',
        body: message,
        url: `/dashboard/iv-tracker/${iv_trip_id}`
      });

      const promises = subs.map(sub => 
        webpush.sendNotification(sub.subscription, payload).catch(err => {
          console.error('Push error:', err);
        })
      );
      await Promise.allSettled(promises);
      sent = subs.length;
    }

    return NextResponse.json({ sent }, { status: 200 });
  } catch (err: any) {
    console.error('Broadcast error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = withApiHandler(handlePOST, { route: '/api/iv/broadcast POST', auth: true, bodySchema: z.object({ iv_trip_id: z.string().uuid(), message: z.string().trim().min(1), gather_lat: z.number().optional(), gather_lng: z.number().optional() }) });
