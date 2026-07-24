import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only faculty or admin can export
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role === 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const courseId = searchParams.get('courseId');

  // Build query for attendance logs
  let query = supabase
    .from('attendance_logs')
    .select(
      'id, status, marked_at, student_id, session_id, profiles!attendance_logs_student_id_fkey(full_name, roll_number), course_sessions!attendance_logs_session_id_fkey(created_at, courses(title, code))'
    )
    .order('marked_at', { ascending: false });

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data: logs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by courseId if requested
  const filteredLogs = courseId
    ? (logs ?? []).filter((l: any) => l.course_sessions?.courses?.code === courseId || l.course_sessions?.courses?.title === courseId)
    : logs ?? [];

  // Build CSV
  const header = ['Name', 'Roll Number', 'Course', 'Course Code', 'Session Date', 'Status', 'Marked At'];
  const rows = filteredLogs.map((l: any) => {
    const profile = l.profiles as any;
    const session = l.course_sessions as any;
    const course = session?.courses as any;
    return [
      `"${profile?.full_name ?? ''}"`,
      `"${profile?.roll_number ?? ''}"`,
      `"${course?.title ?? ''}"`,
      `"${course?.code ?? ''}"`,
      `"${session?.created_at ? new Date(session.created_at).toLocaleDateString('en-IN') : ''}"`,
      `"${l.status ?? ''}"`,
      `"${l.marked_at ? new Date(l.marked_at).toLocaleString('en-IN') : ''}"`,
    ].join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');
  const filename = `attendance-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
