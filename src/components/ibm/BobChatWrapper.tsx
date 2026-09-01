'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BobChat } from './BobChat';
import { usePathname } from 'next/navigation';

export function BobChatWrapper() {
  const [userData, setUserData] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // Get enrolled courses for context
      const { data: enrollments } = await supabase.from('course_enrollments').select('courses(title)').eq('student_id', user.id);
      const courses = enrollments?.map((e: any) => Array.isArray(e.courses) ? e.courses[0]?.title : e.courses?.title).filter(Boolean) as string[] || [];

      setUserData({
        role: profile?.role || 'student',
        name: profile?.full_name || 'User',
        courses
      });
    };
    fetchUser();
  }, []);

  if (!userData) return null;

  let currentPage = 'Dashboard overview';
  if (pathname.includes('/courses')) currentPage = 'Courses';
  else if (pathname.includes('/assignments')) currentPage = 'Assignments and tasks';
  else if (pathname.includes('/attendance')) currentPage = 'Attendance tracking';
  else if (pathname.includes('/iv-tracker')) currentPage = 'IV industrial visit tracker';
  else if (pathname.includes('/students')) currentPage = 'Student management';
  else if (pathname.includes('/settings')) currentPage = 'Settings and profile';

  return (
    <BobChat 
      userRole={userData.role} 
      userName={userData.name} 
      context={{ courses: userData.courses, currentPage }} 
    />
  );
}
