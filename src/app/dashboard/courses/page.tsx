'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Clock, Star, Search, Filter, Plus, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { CourseModal } from '@/components/courses/course-modal';

const courses = [
  {
    id: 1,
    code: 'EC-301',
    title: 'Signals and Systems',
    faculty: 'Dr. A. Smith',
    students: 45,
    sessions: 24,
    attendance: 94,
    category: 'Computer Science',
    color: 'from-violet-600 to-fuchsia-500',
    glow: 'oklch(0.65 0.26 285 / 0.25)',
    icon: '🧩',
    status: 'active' as const,
    rating: 4.8,
  },
  {
    id: 2,
    code: 'EC-302',
    title: 'Digital Signal Processing Systems',
    faculty: 'Prof. M. Raj',
    students: 40,
    sessions: 20,
    attendance: 88,
    category: 'Computer Science',
    color: 'from-sky-500 to-cyan-400',
    glow: 'oklch(0.65 0.2 220 / 0.25)',
    icon: '🗄️',
    status: 'active' as const,
    rating: 4.5,
  },
  {
    id: 3,
    code: 'EC-101',
    title: 'Network Analysis I',
    faculty: 'Dr. K. Prasad',
    students: 120,
    sessions: 28,
    attendance: 76,
    category: 'Mathematics',
    color: 'from-emerald-500 to-teal-400',
    glow: 'oklch(0.70 0.20 165 / 0.25)',
    icon: '📐',
    status: 'active' as const,
    rating: 4.2,
  },
  {
    id: 4,
    code: 'EC-303',
    title: 'Analog Circuits',
    faculty: 'Prof. R. Kumar',
    students: 38,
    sessions: 16,
    attendance: 65,
    category: 'Computer Science',
    color: 'from-amber-500 to-orange-400',
    glow: 'oklch(0.75 0.16 85 / 0.25)',
    icon: '🌐',
    status: 'active' as const,
    rating: 4.0,
  },
  {
    id: 5,
    code: 'EC-201',
    title: 'Technical Communication',
    faculty: 'Ms. P. Nair',
    students: 55,
    sessions: 18,
    attendance: 82,
    category: 'English',
    color: 'from-rose-500 to-pink-400',
    glow: 'oklch(0.62 0.22 25 / 0.25)',
    icon: '✍️',
    status: 'active' as const,
    rating: 4.3,
  },
  {
    id: 6,
    code: 'EC-304',
    title: 'Microprocessors',
    faculty: 'Dr. S. Ramesh',
    students: 42,
    sessions: 10,
    attendance: 90,
    category: 'Computer Science',
    color: 'from-indigo-500 to-blue-400',
    glow: 'oklch(0.60 0.22 270 / 0.25)',
    icon: '⚙️',
    status: 'upcoming' as const,
    rating: 4.6,
  },
];

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [activeCourse, setActiveCourse] = useState<any>(null);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.faculty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Courses</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{courses.length} courses enrolled this semester</p>
        </div>
        <Button
          id="add-course-btn"
          className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
        >
          <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          Add Course
        </Button>
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
            className="pl-9 h-10 bg-secondary/40 border-border/40 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <Button variant="outline" className="h-10 border-border/40 rounded-xl gap-2 text-muted-foreground hover:text-foreground">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course, i) => (
          <div
            key={course.id}
            className="animate-slide-in-up opacity-0"
            style={{ animationDelay: `${(i + 1) * 60}ms`, animationFillMode: 'forwards' }}
          >
            <TiltCard intensity={10}>
              <div
                className="glass-card rounded-2xl overflow-hidden h-full flex flex-col cursor-pointer hover:border-primary/50 transition-colors"
                style={{ boxShadow: `0 4px 24px ${course.glow}` }}
                onClick={() => setActiveCourse(course)}
              >
                {/* Top color bar */}
                <div className={`h-1 bg-gradient-to-r ${course.color}`} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Icon + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {course.icon}
                    </div>
                    <Badge variant={course.status === 'active' ? 'active' : 'secondary'} dot>
                      {course.status === 'active' ? 'Active' : 'Upcoming'}
                    </Badge>
                  </div>

                  {/* Title */}
                  <div className="mb-3">
                    <span className="text-[11px] font-mono text-muted-foreground">{course.code}</span>
                    <h3 className="text-base font-bold text-foreground mt-0.5 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{course.faculty}</p>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-background/30">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-bold text-foreground">{course.students}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Students</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background/30">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-bold text-foreground">{course.sessions}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-background/30">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Star className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-bold text-foreground">{course.rating}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Rating</p>
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5 text-xs">
                      <span className="text-muted-foreground">Attendance</span>
                      <span className={`font-semibold ${
                        course.attendance >= 80 ? 'text-emerald-400' :
                        course.attendance >= 70 ? 'text-amber-400' : 'text-red-400'
                      }`}>{course.attendance}%</span>
                    </div>
                    <Progress
                      value={course.attendance}
                      variant={course.attendance >= 80 ? 'emerald' : course.attendance >= 70 ? 'gold' : 'red'}
                      size="md"
                    />
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 group rounded-xl"
                    >
                      View Course
                      <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No courses match your search.</p>
        </div>
      )}

      {/* Interactive Modal Workspace */}
      <CourseModal 
        isOpen={!!activeCourse} 
        onClose={() => setActiveCourse(null)} 
        course={activeCourse} 
      />
    </div>
  );
}
