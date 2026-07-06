import { SupabaseClient } from '@supabase/supabase-js';

// ---- Type Definitions ----
export type Profile = {
  id: string;
  full_name: string | null;
  role: 'student' | 'faculty' | 'admin';
  avatar_url: string | null;
  department: string | null;
  year_of_study: number | null;
  college: string | null;
  roll_number: string | null;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CourseEnrollment = {
  student_id: string;
  course_id: string;
  enrolled_at: string;
};

export type AttendanceSession = {
  id: string;
  course_id: string;
  created_by: string;
  room: string | null;
  status: 'active' | 'closed';
  qr_token: string;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceLog = {
  id: string;
  session_id: string;
  student_id: string;
  status: string;
  marked_at: string;
};

export type Assignment = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
};

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  status: 'pending' | 'submitted' | 'graded';
  file_url: string | null;
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
};

export type DashboardStats = {
  totalStudents: number;
  totalCourses: number;
  attendanceRate: number;
  pendingAssignments: number;
};

// ---- Queries ----

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

export async function getDashboardStats(supabase: SupabaseClient, userId: string, role: string): Promise<DashboardStats> {
  let totalStudents = 0;
  let totalCourses = 0;
  let attendanceRate = 0;
  let pendingAssignments = 0;

  try {
    // 1. Total Students
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');
    totalStudents = studentCount || 0;

    // 2. Total Courses
    const { count: courseCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
    totalCourses = courseCount || 0;

    // 3. Attendance Rate (overall)
    // We can estimate this by checking attendance_logs count vs total expected
    // For simplicity, let's just get the ratio of 'Present' vs all logs for this user if student, or all if admin
    let logsQuery = supabase.from('attendance_logs').select('status');
    if (role === 'student') {
      logsQuery = logsQuery.eq('student_id', userId);
    }
    const { data: logs } = await logsQuery;
    
    if (logs && logs.length > 0) {
      const presentCount = logs.filter((l: any) => l.status === 'Present').length;
      attendanceRate = Math.round((presentCount / logs.length) * 100);
    } else {
      attendanceRate = 100; // default if no classes
    }

    // 4. Pending Assignments
    if (role === 'student') {
      const { count: pendingCount } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId)
        .eq('status', 'pending');
      pendingAssignments = pendingCount || 0;
    } else {
      const { count: ungradedCount } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');
      pendingAssignments = ungradedCount || 0;
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }

  return { totalStudents, totalCourses, attendanceRate, pendingAssignments };
}

export async function getCourses(supabase: SupabaseClient): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  return data;
}

export async function getEnrolledCourses(supabase: SupabaseClient, studentId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('courses(*)')
    .eq('student_id', studentId);
  
  if (error) {
    console.error('Error fetching enrolled courses:', error);
    return [];
  }
  // Data comes back as [{ courses: { ... } }, ...]
  return data.map((item: any) => item.courses) as Course[];
}

export async function enrollInCourse(supabase: SupabaseClient, studentId: string, courseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('course_enrollments')
    .insert({ student_id: studentId, course_id: courseId });
  
  if (error) {
    console.error('Error enrolling in course:', error);
    return false;
  }
  return true;
}

export async function getStudents(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name', { ascending: true });
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  return data;
}

export async function getAttendanceSessions(supabase: SupabaseClient, facultyId?: string): Promise<AttendanceSession[]> {
  let query = supabase.from('course_sessions').select('*').order('created_at', { ascending: false });
  
  if (facultyId) {
    query = query.eq('created_by', facultyId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching attendance sessions:', error);
    return [];
  }
  return data;
}

export async function createAttendanceSession(
  supabase: SupabaseClient, 
  courseId: string, 
  facultyId: string,
  qrToken: string
): Promise<AttendanceSession | null> {
  const { data, error } = await supabase
    .from('course_sessions')
    .insert({
      course_id: courseId,
      created_by: facultyId,
      qr_token: qrToken,
      status: 'active'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating session:', error);
    return null;
  }
  return data;
}

export async function markAttendance(
  supabase: SupabaseClient, 
  sessionId: string, 
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('attendance_logs')
    .insert({
      session_id: sessionId,
      student_id: studentId,
      status: 'Present'
    });
    
  if (error) {
    console.error('Error marking attendance:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getAssignments(supabase: SupabaseClient, courseId?: string): Promise<Assignment[]> {
  let query = supabase.from('assignments').select('*').order('due_date', { ascending: true });
  
  if (courseId) {
    query = query.eq('course_id', courseId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
  return data;
}

export async function getSubmissions(
  supabase: SupabaseClient, 
  assignmentId?: string, 
  studentId?: string
): Promise<AssignmentSubmission[]> {
  let query = supabase.from('assignment_submissions').select('*, assignments(*), profiles(full_name)');
  
  if (assignmentId) {
    query = query.eq('assignment_id', assignmentId);
  }
  
  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }
  return data;
}

export async function updateSubmissionStatus(
  supabase: SupabaseClient,
  submissionId: string,
  status: 'pending' | 'submitted' | 'graded',
  grade?: number,
  feedback?: string,
  fileUrl?: string
): Promise<boolean> {
  const updateData: any = { status };
  if (grade !== undefined) updateData.grade = grade;
  if (feedback !== undefined) updateData.feedback = feedback;
  if (fileUrl !== undefined) updateData.file_url = fileUrl;
  
  if (status === 'submitted' && !updateData.submitted_at) {
    updateData.submitted_at = new Date().toISOString();
  }
  if (status === 'graded' && !updateData.graded_at) {
    updateData.graded_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('assignment_submissions')
    .update(updateData)
    .eq('id', submissionId);
    
  if (error) {
    console.error('Error updating submission:', error);
    return false;
  }
  return true;
}

export async function getNotifications(supabase: SupabaseClient, userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data;
}

export async function markNotificationRead(supabase: SupabaseClient, notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
    
  if (error) {
    console.error('Error marking notification read:', error);
    return false;
  }
  return true;
}
