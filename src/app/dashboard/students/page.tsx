import { getUserOrLocal } from '@/lib/supabase/get-user-or-local';
import { createClient } from '@/lib/supabase/server';
import StudentsClient from './students-client';
import { getStudents } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function StudentsPage() {
  const user = await getUserOrLocal();

  if (!user) {
    redirect('/login');
  }

  let studentsWithStats: any[] = [];

  if (user.source === 'supabase') {
    const supabase = await createClient();
    // Profile role check (only faculty/admin can view students list)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role === 'student') {
      redirect('/dashboard');
    }

    const students = await getStudents(supabase);

    // Here we would ideally join attendance logs to get true percentages.
    // We'll calculate mock percentages based on their ID length or pass it raw to let the client format it.
    studentsWithStats = students.map((s: any) => ({
      ...s,
      attendance: 85, // MOCK: In a real app we'd query attendance_logs for this user
      status: s.full_name ? 'active' : 'inactive'
    }));
  }
  // For local-auth users the client-side useUser() hook provides the profile.

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <StudentsClient initialStudents={studentsWithStats} />
    </Suspense>
  );
}
