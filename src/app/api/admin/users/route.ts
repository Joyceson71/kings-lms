import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/** Verify caller is an admin via their session (RLS-aware client). */
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
 * PATCH /api/admin/users
 *
 * Body: { id: string; role?: 'student'|'faculty'|'admin'; status?: 'active'|'suspended' }
 *
 * Updates the target user's role and/or status.
 * Admins cannot change their own role (safety guard).
 */
export async function PATCH(request: Request) {
  const { error, status, user: admin } = await requireAdmin();
  if (error || !admin) {
    return NextResponse.json({ error }, { status });
  }

  let body: { id?: string; role?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, role, status: newStatus } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing target user id' }, { status: 400 });
  }

  // Prevent self-demotion
  if (id === admin.id && role && role !== 'admin') {
    return NextResponse.json({ error: 'Admins cannot demote themselves' }, { status: 422 });
  }

  // Validate values
  const validRoles = ['student', 'faculty', 'admin'];
  const validStatuses = ['active', 'suspended'];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
  }
  if (newStatus && !validStatuses.includes(newStatus)) {
    return NextResponse.json({ error: `Invalid status: ${newStatus}` }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (role) updates.role = role;
  if (newStatus) updates.status = newStatus;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Use the service-role client to bypass RLS for guaranteed admin writes
  const serviceClient = createServiceClient();
  const { error: dbError } = await serviceClient
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (dbError) {
    console.error('[admin/users PATCH]', dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
