'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Clock, Star, Search, Filter, Plus, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { CourseModal } from '@/components/courses/course-modal';
import { AddCourseModal } from '@/components/courses/add-course-modal';
import { createClient } from '@/lib/supabase/client';

export default function CoursesClient({ allCourses, enrolledCourses, profile }: { allCourses: any[], enrolledCourses: any[], profile: any }) {
  const [search, setSearch] = useState('');
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [localAllCourses, setLocalAllCourses] = useState<any[]>(allCourses);
  const [localEnrolledCourses, setLocalEnrolledCourses] = useState<any[]>(enrolledCourses);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, number>>({});

  const isStudent = profile.role === 'student';

  useEffect(() => {
    if (isStudent && profile.id) {
      const fetchAttendance = async () => {
        const supabase = createClient();
        
        // Fetch all attendance logs for this student
        const { data: logs } = await supabase
          .from('attendance_logs')
          .select('status, course_sessions(course_id)')
          .eq('student_id', profile.id);
          
        if (logs) {
          const stats: Record<string, { present: number, total: number }> = {};
          
          logs.forEach((log: any) => {
            const courseId = log.course_sessions?.course_id;
            if (courseId) {
              if (!stats[courseId]) stats[courseId] = { present: 0, total: 0 };
              stats[courseId].total += 1;
              if (log.status === 'Present') stats[courseId].present += 1;
            }
          });
          
          const pct: Record<string, number> = {};
          Object.keys(stats).forEach(courseId => {
            pct[courseId] = Math.round((stats[courseId].present / stats[courseId].total) * 100);
          });
          setAttendanceStats(pct);
        }
      };
      
      fetchAttendance();
    }
  }, [isStudent, profile.id]);

  const formatCourse = (c: any) => ({
    id: c.id,
    code: c.id.substring(0, 8).toUpperCase(),
    title: c.title,
    faculty: c.profiles?.full_name || 'Instructor',
    students: c.course_enrollments?.[0]?.count || 0,
    sessions: 0,
    attendance: attendanceStats[c.id] !== undefined ? attendanceStats[c.id] : 100,
    category: 'Course',
    icon: '📚',
    status: 'active' as const,
    rating: 0,
    description: c.description,
    department: c.department || 'Global'
  });

  const enrolledIds = new Set(localEnrolledCourses.map(c => c.id));
  const displayCourses = isStudent ? localAllCourses.map(formatCourse) : localAllCourses.map(formatCourse);

  const filtered = displayCourses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    const supabase = createClient();
    const { error } = await supabase.from('course_enrollments').insert({
      student_id: profile.id,
      course_id: courseId
    });
    if (!error) {
      const newlyEnrolled = localAllCourses.find(c => c.id === courseId);
      if (newlyEnrolled) {
        setLocalEnrolledCourses([...localEnrolledCourses, newlyEnrolled]);
      }
    }
    setEnrolling(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {isStudent ? 'My Courses' : 'Courses'}
          </h1>
          <p className="text-zinc-400 text-[13px] mt-1">
            {isStudent 
              ? `${localEnrolledCourses.length} courses enrolled` 
              : `${localAllCourses.length} total courses offered`}
          </p>
        </div>
        {!isStudent && (
          <Button
            id="add-course-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="group"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
            Add Course
          </Button>
        )}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 animate-slide-in-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            id="course-search"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2 text-zinc-400">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course, i) => (
          <div
            key={course.id}
            className="animate-slide-in-up opacity-0"
            style={{ animationDelay: `${(i + 1) * 60}ms`, animationFillMode: 'forwards' }}
          >
            <div
              className="rounded-xl overflow-hidden h-full flex flex-col cursor-pointer hover:border-indigo-500/50 transition-colors group"
              style={{ background: '#111113', border: '1px solid #1f1f23' }}
              onClick={() => setActiveCourse(course)}
            >
              <div className="p-4 flex flex-col flex-1">
                {/* Icon + status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#1a1a1d', border: '1px solid #2a2a2e' }}>
                    {course.icon}
                  </div>
                  {isStudent && enrolledIds.has(course.id) ? (
                    <Badge variant="success" dot>Enrolled</Badge>
                  ) : (
                    <Badge variant={course.status === 'active' ? 'active' : 'secondary'} dot>
                      {course.status === 'active' ? 'Active' : 'Upcoming'}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-zinc-500">{course.code}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 border-indigo-500/30 text-indigo-400">
                      {course.department}
                    </Badge>
                  </div>
                  <h3 className="text-[14px] font-semibold text-white mt-0.5 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-[12px] text-zinc-400 mt-1">{course.faculty}</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-md" style={{ background: '#0a0a0b', border: '1px solid #1a1a1d' }}>
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <Users className="h-3 w-3 text-zinc-500" />
                      <span className="text-[12px] font-semibold text-white">{course.students}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Students</p>
                  </div>
                  <div className="text-center p-2 rounded-md" style={{ background: '#0a0a0b', border: '1px solid #1a1a1d' }}>
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span className="text-[12px] font-semibold text-white">{course.sessions}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Sessions</p>
                  </div>
                  <div className="text-center p-2 rounded-md" style={{ background: '#0a0a0b', border: '1px solid #1a1a1d' }}>
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <Star className="h-3 w-3 text-amber-400" />
                      <span className="text-[12px] font-semibold text-white">{course.rating}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Rating</p>
                  </div>
                </div>

                {/* Attendance */}
                <div className="mb-4 mt-auto">
                  <div className="flex justify-between mb-1.5 text-[11px]">
                    <span className="text-zinc-400">Attendance</span>
                    <span className={`font-semibold ${
                      course.attendance >= 80 ? 'text-emerald-400' :
                      course.attendance >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}>{course.attendance}%</span>
                  </div>
                  <Progress
                    value={course.attendance}
                    variant={course.attendance >= 80 ? 'emerald' : course.attendance >= 70 ? 'gold' : 'red'}
                    size="sm"
                  />
                </div>

                {/* Footer */}
                <div className="pt-3" style={{ borderTop: '1px solid #1a1a1d' }}>
                  {isStudent && !enrolledIds.has(course.id) ? (
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleEnroll(course.id); }}
                      disabled={enrolling === course.id}
                      className="w-full text-[12px] h-8"
                    >
                      {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full text-[12px] h-8 text-zinc-400 group-hover:text-white"
                    >
                      View Course
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ border: '1px dashed #1f1f23', borderRadius: '12px' }}>
          <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-[13px] text-zinc-400">No courses match your search.</p>
        </div>
      )}

      {/* Interactive Modal Workspace */}
      <CourseModal 
        isOpen={!!activeCourse} 
        onClose={() => setActiveCourse(null)} 
        course={activeCourse} 
      />

      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCourseAdded={(newCourse) => {
          setLocalAllCourses((prev) => [newCourse, ...prev]);
        }}
      />
    </div>
  );
}
