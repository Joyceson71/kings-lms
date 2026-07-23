import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
