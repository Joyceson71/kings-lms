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

    const { iv_trip_id, lat, lng, student_id, sos_id } = await request.json();
    
    if (!iv_trip_id || !lat || !lng || !student_id) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    if (user.id !== student_id) {
      return NextResponse.json({ error: 'Forbidden: Student ID mismatch' }, { status: 403 });
    }

    const serviceClient = createServiceClient();
    
    // Get student name
    const { data: student } = await serviceClient.from('profiles').select('full_name').eq('id', student_id).single();
    const studentName = student?.full_name || 'A student';
    
    // Get all faculty/admin push subscriptions
    const { data: profiles } = await serviceClient.from('profiles').select('id').in('role', ['faculty', 'admin']);
    
    if (profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.id);
      const { data: subs } = await serviceClient.from('push_subscriptions').select('subscription').in('user_id', userIds);
      
      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: '🚨 SOS ALERT 🚨',
          body: `${studentName} needs help at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
          url: `/dashboard/iv-tracker/${iv_trip_id}?sos=${sos_id}`
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
    console.error('SOS error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
