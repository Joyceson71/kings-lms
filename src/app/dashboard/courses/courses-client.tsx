'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Clock, Star, Search, Filter, Plus, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { CourseModal } from '@/components/courses/course-modal';
import { AddCourseModal } from '@/components/courses/add-course-modal';
import { CourseCard } from '@/components/courses/course-card';
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
  const displayCourses = localAllCourses.map(formatCourse);

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
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {isStudent ? 'My Courses' : 'Courses'}
          </h1>
          <p className="text-muted-foreground text-[13px] mt-1">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="course-search"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2 text-muted-foreground">
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
            <CourseCard
              course={course}
              isStudent={isStudent}
              enrolledIds={enrolledIds}
              enrolling={enrolling}
              handleEnroll={handleEnroll}
              setActiveCourse={setActiveCourse}
            />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ border: '1px dashed #1f1f23', borderRadius: '12px' }}>
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground">No courses match your search.</p>
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
