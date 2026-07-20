import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDepartmentsClient from './departments-client';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function AdminDepartmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Middleware guards this, but checking again server-side
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch departments with their head's name
  const { data: rawDepartments } = await supabase
    .from('departments')
    .select(`
      id,
      code,
      name,
      head_id,
      profiles!departments_head_id_fkey (
        full_name
      )
    `)
    .order('code', { ascending: true });

  // Count students per department
  const { data: profiles } = await supabase
    .from('profiles')
    .select('department, role');

  const studentCounts = (profiles || []).reduce((acc: Record<string, number>, p: any) => {
    if (p.role === 'student' && p.department) {
      acc[p.department] = (acc[p.department] || 0) + 1;
    }
    return acc;
  }, {});

  const departments = (rawDepartments || []).map((d: any) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    head_id: d.head_id,
    head_name: d.profiles?.full_name || null,
    student_count: studentCounts[d.code] || 0
  }));

  // Fetch faculties for HOD assignment
  const { data: faculties } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'faculty');

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AdminDepartmentsClient
        initialDepartments={departments}
        faculties={faculties || []}
      />
    </Suspense>
  );
}
