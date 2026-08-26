import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TimetableClient from './client';

export default async function TimetablePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, roll_number, department, semester')
    .eq('id', user.id)
    .single();

  const isFaculty = profile?.role === 'faculty' || profile?.role === 'admin';

  // Fetch timetable entries
  let timetableData: any[] = [];
  let availableCourses: any[] = [];

  if (isFaculty) {
    // Faculty sees timetable for courses they teach
    const { data: courses } = await supabase.from('courses').select('id, title, code').eq('faculty_id', user.id);
    availableCourses = courses || [];
    
    if (courses && courses.length > 0) {
      const { data } = await supabase
        .from('timetable')
        .select('*, courses(title, code)')
        .in('course_id', courses.map(c => c.id));
      timetableData = data || [];
    }
  } else {
    // Student sees timetable based on enrolled courses
    const { data: enrollments } = await supabase.from('course_enrollments').select('course_id, courses(title, code)').eq('student_id', user.id);
    
    if (enrollments && enrollments.length > 0) {
      const courseIds = enrollments.map((e: any) => e.course_id);
      const { data } = await supabase
        .from('timetable')
        .select('*, courses(title, code)')
        .in('course_id', courseIds);
      timetableData = data || [];
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Class Timetable</h1>
        <p className="text-muted-foreground">View your weekly schedule.</p>
      </div>
      
      <TimetableClient 
        initialData={timetableData} 
        isFaculty={isFaculty} 
        courses={availableCourses}
      />
    </div>
  );
}
