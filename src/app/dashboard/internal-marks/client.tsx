'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MarksTable } from '@/components/iv/marks-table';
import { AttendanceRing } from '@/components/iv/attendance-ring';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Course = { id: string; title: string; code: string };

type Props = {
  userId: string;
  isFaculty: boolean;
  courses: any[];
};

export default function InternalMarksClient({ userId, isFaculty, courses }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses.length > 0 ? courses[0].id : '');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [studentId: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const examTypes = ['unit_test_1', 'unit_test_2', 'model_exam', 'practical', 'assignment'];

  useEffect(() => {
    if (!selectedCourseId) return;
    fetchCourseData(selectedCourseId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  const fetchCourseData = async (courseId: string) => {
    setLoading(true);
    try {
      // 1. Fetch Enrolled Students
      let enrolledIds = [userId]; // default for student view
      if (isFaculty) {
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('student_id, profiles(id, full_name, roll_number)')
          .eq('course_id', courseId);
        
        if (enrollments) {
          const mapped = enrollments.map(e => e.profiles).filter(Boolean);
          setStudents(mapped);
          enrolledIds = mapped.map((m: any) => m.id);
        }
      } else {
        // Just fetch self
        const { data: me } = await supabase.from('profiles').select('id, full_name, roll_number').eq('id', userId).single();
        if (me) setStudents([me]);
      }

      // 2. Fetch Marks
      const { data: marksData } = await supabase
        .from('internal_marks')
        .select('*')
        .eq('course_id', courseId)
        .in('student_id', enrolledIds);
      
      setMarks(marksData || []);

      // 3. Calculate accurate attendance (Fix for SIH prompt issue #2)
      // Total sessions for this course
      const { count: totalSessions } = await supabase
        .from('course_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      // Student logs
      if (totalSessions && totalSessions > 0) {
        const { data: logs } = await supabase
          .from('attendance_logs')
          .select('student_id, session_id, course_sessions!inner(course_id)')
          .eq('course_sessions.course_id', courseId)
          .in('student_id', enrolledIds);
          
        const attMap: { [id: string]: number } = {};
        enrolledIds.forEach(id => {
          const studentLogs = logs?.filter(l => l.student_id === id) || [];
          attMap[id] = (studentLogs.length / totalSessions) * 100;
        });
        setAttendance(attMap);
      } else {
        const attMap: { [id: string]: number } = {};
        enrolledIds.forEach(id => { attMap[id] = 100; }); // No sessions = 100%
        setAttendance(attMap);
      }

    } catch (error) {
      console.error('Failed to fetch IV data', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskStatus = (studentId: string) => {
    const att = attendance[studentId] || 0;
    const studentMarks = marks.filter(m => m.student_id === studentId);
    let failingMarks = false;
    
    if (studentMarks.length > 0) {
      const totalObtained = studentMarks.reduce((acc, m) => acc + (m.marks_obtained || 0), 0);
      const avg = totalObtained / studentMarks.length;
      if (avg < 50) failingMarks = true;
    }

    if (att < 75 || failingMarks) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {courses.length === 0 ? (
        <div className="text-center p-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">You are not assigned to any courses yet.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
            <div>
              <h2 className="text-lg font-bold">Select Course</h2>
              <p className="text-sm text-muted-foreground">View and manage internal marks</p>
            </div>
            <Select value={selectedCourseId} onValueChange={(val) => val && setSelectedCourseId(val)}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Alert Banner for Students at Risk */}
              {!isFaculty && students.length > 0 && getRiskStatus(userId) && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold">Academic Risk Warning</h3>
                    <p className="text-sm opacity-90">Your attendance is below 75% or your internal marks average is failing. Please contact your faculty advisor.</p>
                  </div>
                </div>
              )}

              {/* Student Overview Cards (If Student) */}
              {!isFaculty && students.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-6 shadow-sm">
                    <AttendanceRing percentage={attendance[userId] || 0} />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Course Attendance</h3>
                      <p className="text-2xl font-bold">{Math.round(attendance[userId] || 0)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Marks Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Assessment Marks</h3>
                  {isFaculty && (
                    <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {students.length} Students Enrolled
                    </span>
                  )}
                </div>
                
                {students.length > 0 ? (
                  <MarksTable 
                    courseId={selectedCourseId}
                    students={students}
                    initialMarks={marks}
                    isFaculty={isFaculty}
                    examTypes={examTypes}
                  />
                ) : (
                  <div className="text-center p-12 bg-secondary/20 rounded-xl border border-dashed border-border">
                    <p className="text-muted-foreground">No students enrolled in this course.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
