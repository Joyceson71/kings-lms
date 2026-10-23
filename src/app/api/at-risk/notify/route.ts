import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '@/lib/api/handler';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const schema = z.object({ course_id: z.string().uuid(), student_ids: z.array(z.string().uuid()).min(1).max(100), title: z.string().trim().min(1).max(120), message: z.string().trim().min(1).max(1000) }).strict();
async function handlePOST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const limited = await checkRateLimit(`at-risk-notify:${user.id}`, { limit: 5, windowMs: 60_000 });
  if (!limited.allowed) return NextResponse.json({ error: 'Too many notifications. Please wait before retrying.' }, { status: 429 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid notification request.' }, { status: 400 });
  const { course_id, student_ids, title, message } = parsed.data;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['faculty', 'admin'].includes(profile.role ?? '')) return NextResponse.json({ error: 'Faculty or admin access required.' }, { status: 403 });
  const service = createServiceClient();
  let courseQuery = service.from('courses').select('id').eq('id', course_id);
  if (profile.role === 'faculty') courseQuery = courseQuery.eq('created_by', user.id);
  const { data: course } = await courseQuery.maybeSingle();
  if (!course) return NextResponse.json({ error: 'Course not found or access denied.' }, { status: 403 });
  const { data: enrollments, error: enrollmentError } = await service.from('course_enrollments').select('student_id').eq('course_id', course_id).in('student_id', student_ids);
  if (enrollmentError) throw enrollmentError;
  const allowed = new Set((enrollments ?? []).map(row => row.student_id));
  if (student_ids.some(id => !allowed.has(id))) return NextResponse.json({ error: 'One or more selected students are not enrolled in this course.' }, { status: 400 });
  const { error } = await service.from('notifications').insert(student_ids.map(user_id => ({ user_id, title, message, type: 'info' })));
  if (error) throw error;
  return NextResponse.json({ success: true, sent: student_ids.length });
}

export const POST = withApiHandler(handlePOST, { route: '/api/at-risk/notify POST', auth: true, bodySchema: schema });
