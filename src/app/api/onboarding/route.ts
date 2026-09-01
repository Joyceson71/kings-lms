import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, department, rollNumber, employeeId, courses } = body;

    // Update profile
    const { data: profile } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        department,
        roll_number: rollNumber || null,
        employee_id: employeeId || null,
        onboarding_complete: true,
      })
      .eq('id', user.id)
      .select('role')
      .single();

    if (profile?.role === 'student' && courses?.length > 0) {
      const enrollments = courses.map((courseId: string) => ({
        student_id: user.id,
        course_id: courseId,
      }));
      await supabase.from('course_enrollments').upsert(enrollments, { onConflict: 'student_id, course_id' });
    } else if (profile?.role === 'faculty' && courses?.length > 0) {
      // For faculty, assign them as created_by/faculty_id to those courses
      // Wait, courses usually belong to one faculty. The prompt says "select courses taught".
      // We can update the courses table to set created_by = user.id, faculty_id = user.id.
      // Assuming 'created_by' is the faculty.
      for (const courseId of courses) {
         await supabase.from('courses').update({ created_by: user.id }).eq('id', courseId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
