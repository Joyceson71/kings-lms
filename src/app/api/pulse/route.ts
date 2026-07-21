import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, signal } = body;

    if (!session_id || !signal) {
      return NextResponse.json({ error: 'session_id and signal are required.' }, { status: 400 });
    }

    const VALID_SIGNALS = ['confused', 'got_it', 'question'] as const;
    if (!VALID_SIGNALS.includes(signal)) {
      return NextResponse.json({ error: 'Invalid signal type.' }, { status: 400 });
    }

    // Verify the session is still active
    const { data: session, error: sessionError } = await supabase
      .from('course_sessions')
      .select('id, status, course_id')
      .eq('id', session_id)
      .eq('status', 'active')
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or not active.' }, { status: 404 });
    }

    // Rate-limit: allow max 1 signal per 30 seconds per session per user.
    // We can't use student_id (anonymous), so we rely on Supabase's row-level
    // rate limiting at the app level by checking the request header or a
    // simple client-side gate (enforced in the UI component).
    // For extra safety, insert the signal:
    const { error: insertError } = await supabase
      .from('pulse_signals')
      .insert({ session_id, signal });

    if (insertError) {
      console.error('Pulse insert error:', insertError);
      return NextResponse.json({ error: 'Failed to send signal.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Pulse API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
