import { createClient } from '@/lib/supabase/server';
import AdminUsersClient, { ActivityItem } from './users-client';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function AdminUsersPage() {
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

  // Middleware already guards this route but we double-check server-side.
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, created_at, department, college')
    .order('created_at', { ascending: false });

  // Fetch recent signups for activity feed
  const { data: recentSignups } = await supabase
    .from('profiles')
    .select('full_name, email, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  // Fetch recent courses for activity feed
  const { data: recentCourses } = await supabase
    .from('courses')
    .select('title, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  const activities: ActivityItem[] = [];

  if (recentSignups) {
    recentSignups.forEach((u) => {
      activities.push({
        id: `signup-${u.email}`,
        type: 'user',
        message: `New user "${u.full_name || u.email}" registered`,
        time: u.created_at,
      });
    });
  }

  if (recentCourses) {
    recentCourses.forEach((c) => {
      activities.push({
        id: `course-${c.title}`,
        type: 'course',
        message: `New course "${c.title}" was created`,
        time: c.created_at,
      });
    });
  }

  // Sort activities by time descending and take top 5
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const recentActivity = activities.slice(0, 5);

  // Fetch system stats
  const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
  const { count: sessionsCount } = await supabase.from('attendance_sessions').select('*', { count: 'exact', head: true });
  const { count: enrollmentsCount } = await supabase.from('course_enrollments').select('*', { count: 'exact', head: true });
  const { count: departmentsCount } = await supabase.from('departments').select('*', { count: 'exact', head: true });

  const systemStats = {
    courses: coursesCount || 0,
    sessions: sessionsCount || 0,
    enrollments: enrollmentsCount || 0,
    departments: departmentsCount || 0,
  };

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AdminUsersClient
        initialUsers={users || []}
        currentUserId={user.id}
        recentActivity={recentActivity}
        systemStats={systemStats}
      />
    </Suspense>
  );
}
