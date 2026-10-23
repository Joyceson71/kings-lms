import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '@/lib/api/handler';
import { createClient } from '@/lib/supabase/server';

const querySchema = z.object({ q: z.string().trim().min(2).max(80) }).strict();
type SearchResult = { id: string; title: string; kind: string; href: string; detail: string };

async function handleGET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ results: [] });
  const supabase = await createClient();
  const term = `%${parsed.data.q.replace(/[%_,]/g, ' ')}%`;
  const [courses, assignments, materials, announcements] = await Promise.all([
    supabase.from('courses').select('id,title,code').ilike('title', term).limit(5),
    supabase.from('assignments').select('id,title,course_id').ilike('title', term).limit(5),
    supabase.from('course_materials').select('id,title,course_id').ilike('title', term).limit(5),
    supabase.from('announcements').select('id,title,course_id').ilike('title', term).limit(5),
  ]);
  const results: SearchResult[] = [
    ...(courses.data ?? []).map(row => ({ id: row.id, title: row.title, kind: 'Course', href: `/dashboard/courses/${row.id}`, detail: row.code ?? 'Course' })),
    ...(assignments.data ?? []).map(row => ({ id: row.id, title: row.title, kind: 'Assignment', href: '/dashboard/assignments', detail: 'Assignment' })),
    ...(materials.data ?? []).map(row => ({ id: row.id, title: row.title, kind: 'Resource', href: '/dashboard/resources', detail: 'Course material' })),
    ...(announcements.data ?? []).map(row => ({ id: row.id, title: row.title, kind: 'Announcement', href: '/dashboard/announcements', detail: 'Announcement' })),
  ].slice(0, 15);
  return NextResponse.json({ results });
}

export const GET = withApiHandler(handleGET, { route: '/api/search GET', auth: true, querySchema });
