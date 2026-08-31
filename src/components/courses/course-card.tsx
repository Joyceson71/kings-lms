import { Users, Clock, Star, ArrowRight, Zap } from 'lucide-react';
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
  const attendanceColor =
    course.attendance >= 80 ? '#39FF14' :
    course.attendance >= 70 ? '#FFD700' : '#FF006E';
  const attendanceShadow =
    course.attendance >= 80 ? 'rgb(57 255 20 / 0.4)' :
    course.attendance >= 70 ? 'rgb(255 215 0 / 0.4)' : 'rgb(255 0 110 / 0.4)';

  return (
    <TiltCard holoEffect={true} glareEnable={true} className="clip-corner overflow-hidden h-full">
      <div
        className="clip-corner overflow-hidden h-full flex flex-col cursor-pointer group relative"
        style={{
          background: '#111120',
          border: '2px solid #252545',
          boxShadow: '5px 5px 0 rgb(255 0 110 / 0.2), 10px 10px 0 rgba(0, 245, 255, 0.08)',
          transition: 'all 0.2s ease',
        }}
        onClick={() => setActiveCourse(course)}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translate(-3px, -3px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0 rgb(255 0 110 / 0.3), 14px 14px 0 rgba(0, 245, 255, 0.12)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
          (e.currentTarget as HTMLElement).style.boxShadow = '5px 5px 0 rgb(255 0 110 / 0.2), 10px 10px 0 rgba(0, 245, 255, 0.08)';
        }}
      >
        {/* Energy bar accent at top */}
        <div className="energy-bar-thin" />

        {/* Corner cut decoration */}
        <div
          className="absolute top-0 right-0 w-5 h-5"
          style={{
            background: 'linear-gradient(225deg, #252545 50%, transparent 50%)',
          }}
        />

        <div className="p-4 flex flex-col flex-1">
          {/* Icon + status */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="h-10 w-10 rounded-md flex items-center justify-center text-xl neo-raised"
            >
              {course.icon}
            </div>
            {isStudent && enrolledIds.has(course.id) ? (
              <span className="anime-badge anime-badge-volt">Enrolled</span>
            ) : (
              <span className={`anime-badge ${course.status === 'active' ? 'anime-badge-cyan' : 'anime-badge-pink'}`}>
                {course.status === 'active' ? 'Active' : 'Upcoming'}
              </span>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-muted-foreground tracking-wider">{course.code}</span>
              <span className="anime-badge anime-badge-pink text-[8px] px-1.5">{course.department}</span>
            </div>
            <h3 className="text-[14px] font-black text-foreground mt-0.5 leading-snug tracking-tight uppercase">
              {course.title}
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1">{course.faculty}</p>
          </div>

          {/* Stats row — neomorphic */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: Users,  value: course.students, label: 'Students', color: '#00F5FF' },
              { icon: Clock,  value: course.sessions,  label: 'Sessions',  color: '#BF00FF' },
              { icon: Star,   value: course.rating,   label: 'Rating',   color: '#FFD700' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="text-center p-2 rounded-md neo-inset">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Icon className="h-3 w-3" style={{ color }} />
                  <span className="text-[12px] font-black text-foreground">{value}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* Anime energy attendance bar */}
          <div className="mb-4 mt-auto">
            <div className="flex justify-between mb-1.5 text-[11px]">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider">Attendance</span>
              <span className="font-black" style={{ color: attendanceColor, textShadow: `0 0 8px ${attendanceShadow}` }}>
                {course.attendance}%
              </span>
            </div>
            {/* Custom brutalist progress bar */}
            <div className="h-[3px] bg-muted rounded-none overflow-hidden">
              <div
                className="h-full rounded-none transition-all duration-700"
                style={{
                  width: `${course.attendance}%`,
                  background: `linear-gradient(90deg, ${attendanceColor}, ${attendanceColor}88)`,
                  boxShadow: `0 0 8px ${attendanceShadow}`,
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3" style={{ borderTop: '1px solid #252545' }}>
            {isStudent && !enrolledIds.has(course.id) ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleEnroll(course.id); }}
                disabled={enrolling === course.id}
                className="w-full h-9 text-[12px] font-black uppercase tracking-wider transition-all duration-200 rounded-md clip-corner-sm"
                style={{
                  background: 'linear-gradient(135deg, #FF006E, #BF00FF)',
                  color: '#ffffff',
                  boxShadow: '4px 4px 0 rgb(255 0 110 / 0.3)',
                  border: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 rgb(255 0 110 / 0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 rgb(255 0 110 / 0.3)';
                }}
              >
                {enrolling === course.id ? (
                  <span className="flex items-center justify-center gap-2"><Zap className="h-3 w-3 animate-spin" />Enrolling...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Zap className="h-3 w-3" />Enroll Now</span>
                )}
              </button>
            ) : (
              <button
                className="w-full h-9 text-[12px] font-bold uppercase tracking-wider transition-all duration-200 rounded-md text-muted-foreground hover:text-foreground"
                style={{ background: 'transparent', border: '1px solid #252545' }}
              >
                <span className="flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                  View Course
                  <ArrowRight className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
