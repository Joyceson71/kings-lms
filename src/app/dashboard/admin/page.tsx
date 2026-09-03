import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminClient from './client';
import { getProfile } from '@/lib/supabase/queries';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getProfile(supabase, user.id);
  // Middleware already protects this route, but just in case:
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, department, year_of_study, college, roll_number, created_at, status')
    .order('created_at', { ascending: false });

  const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
  const { count: facultyCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty');
  const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });

  const stats = {
    students: studentCount || 0,
    faculty: facultyCount || 0,
    courses: courseCount || 0,
  };

  return (
    <AdminClient users={users || []} stats={stats} />
  );
}
