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

    const { iv_trip_id, user_id, zone_id } = await request.json();

    if (user.id !== user_id) {
      return NextResponse.json({ error: 'Forbidden: User ID mismatch' }, { status: 403 });
    }

    const serviceClient = createServiceClient();
    
    // Get student name
    const { data: student } = await serviceClient.from('profiles').select('full_name').eq('id', user_id).single();
    const studentName = student?.full_name || 'A student';
    
    // Get zone name
    const { data: zone } = await serviceClient.from('iv_geofence_zones').select('name, zone_type').eq('id', zone_id).single();
    const zoneName = zone?.name || 'a zone';
    
    const breachType = zone?.zone_type === 'permitted' ? 'exited' : 'entered';
    
    // Get all faculty/admin push subscriptions
    const { data: profiles } = await serviceClient.from('profiles').select('id').in('role', ['faculty', 'admin']);
    
    if (profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.id);
      const { data: subs } = await serviceClient.from('push_subscriptions').select('subscription').in('user_id', userIds);
      
      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: '⚠️ Geofence Alert',
          body: `${studentName} has ${breachType} ${zoneName}`,
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
    console.error('Geofence alert error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
