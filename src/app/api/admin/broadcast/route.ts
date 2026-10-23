import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';

async function handlePOST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(`broadcast:${user.id}`, { limit: 5, windowMs: 60_000 });
    if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many broadcasts. Please wait before retrying.' }, { status: 429 });

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (title.length > 120 || content.length > 1000) {
      return NextResponse.json({ error: 'Content exceeds maximum length' }, { status: 400 });
    }

    // Insert as a global announcement (course_id = NULL means visible to everyone)
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: title.trim(),
        content: content.trim(),
        course_id: null,       // global
        created_by: user.id,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Broadcast insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error('Broadcast API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiHandler(handlePOST, { route: '/api/admin/broadcast POST', auth: true, bodySchema: z.object({ title: z.string().trim().min(1).max(120), content: z.string().trim().min(1).max(1000) }) });
