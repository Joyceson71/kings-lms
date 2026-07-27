import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Users, Clock, Star, ArrowRight } from 'lucide-react';
import { TiltCard } from '@/components/ui/tilt-card';

interface CourseCardProps {
  course: any;
  isStudent: boolean;
  enrolledIds: Set<string>;
  enrolling: string | null;
  handleEnroll: (id: string) => void;
  setActiveCourse: (course: any) => void;
}

export function CourseCard({
  course,
  isStudent,
  enrolledIds,
  enrolling,
  handleEnroll,
  setActiveCourse,
}: CourseCardProps) {
  return (
    <TiltCard holoEffect={true} glareEnable={true} className="rounded-xl overflow-hidden h-full">
      <div
        className="rounded-xl overflow-hidden h-full flex flex-col cursor-pointer transition-colors group relative z-10"
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
              <span className="text-[11px] font-mono text-muted-foreground">{course.code}</span>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 border-indigo-500/30 text-indigo-400">
                {course.department}
              </Badge>
            </div>
            <h3 className="text-[14px] font-semibold text-foreground mt-0.5 leading-snug">
              {course.title}
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1">{course.faculty}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-md" style={{ background: '#0a0a0b', border: '1px solid #1a1a1d' }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-[12px] font-semibold text-foreground">{course.students}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Students</p>
            </div>
            <div className="text-center p-2 rounded-md" style={{ background: '#0a0a0b', border: '1px solid #1a1a1d' }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[12px] font-semibold text-foreground">{course.sessions}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Sessions</p>
            </div>
            <div className="text-center p-2 rounded-md" style={{ background: '#0a0a0b', border: '1px solid #1a1a1d' }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Star className="h-3 w-3 text-amber-400" />
                <span className="text-[12px] font-semibold text-foreground">{course.rating}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Rating</p>
            </div>
          </div>

          {/* Attendance */}
          <div className="mb-4 mt-auto">
            <div className="flex justify-between mb-1.5 text-[11px]">
              <span className="text-muted-foreground">Attendance</span>
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
                className="w-full text-[12px] h-8 text-muted-foreground group-hover:text-foreground"
              >
                View Course
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
