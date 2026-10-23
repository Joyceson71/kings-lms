import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/** Verify caller is an admin via their session */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthenticated', status: 401, user: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return { error: 'Forbidden', status: 403, user: null };
  }
  return { error: null, status: 200, user };
}

/**
 * POST /api/admin/departments
 * Body: { code: string, name: string, head_id?: string }
 */
async function handlePOST(request: Request) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { code, name, head_id } = body;
  if (!code || !name) {
    return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data, error: dbError } = await serviceClient
    .from('departments')
    .insert({ code, name, head_id })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

/**
 * PATCH /api/admin/departments
 * Body: { id: string, code?: string, name?: string, head_id?: string }
 */
async function handlePATCH(request: Request) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing department id' }, { status: 400 });
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data, error: dbError } = await serviceClient
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

/**
 * DELETE /api/admin/departments
 * Body: { id: string }
 */
async function handleDELETE(request: Request) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing department id' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { error: dbError } = await serviceClient
    .from('departments')
    .delete()
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export const POST = withApiHandler(handlePOST, { route: '/api/admin/departments POST', auth: true, bodySchema: z.object({ code: z.string().min(1), name: z.string().min(1), head_id: z.string().uuid().optional() }).strict() });
export const PATCH = withApiHandler(handlePATCH, { route: '/api/admin/departments PATCH', auth: true, bodySchema: z.object({ id: z.string().uuid(), code: z.string().optional(), name: z.string().optional(), head_id: z.string().uuid().nullable().optional() }).strict().refine(value => Object.keys(value).some(key => key !== 'id'), { message: 'At least one update field is required' }) });
export const DELETE = withApiHandler(handleDELETE, { route: '/api/admin/departments DELETE', auth: true, bodySchema: z.object({ id: z.string().uuid() }).strict() });
