import { NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { iv_trip_id, message, sender_name } = await request.json();
    const serviceClient = createServiceClient();
    
    // Find all students in this trip via iv_locations
    const { data: locations } = await serviceClient
      .from('iv_locations')
      .select('user_id')
      .eq('iv_trip_id', iv_trip_id);

    if (locations && locations.length > 0) {
      const userIds = Array.from(new Set(locations.map(loc => loc.user_id)));
      
      const { data: subs } = await serviceClient
        .from('push_subscriptions')
        .select('subscription')
        .in('user_id', userIds);
        
      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: `Message from ${sender_name}`,
          body: message.substring(0, 80) + (message.length > 80 ? '...' : ''),
          url: `/dashboard/iv-tracker/${iv_trip_id}`
        });

        const promises = subs.map(sub => 
          webpush.sendNotification(sub.subscription, payload).catch(err => {
            console.error('Push error:', err);
          })
        );
        await Promise.allSettled(promises);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
