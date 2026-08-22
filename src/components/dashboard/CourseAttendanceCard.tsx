import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';
import { CourseWithAttendance } from './types';
import { getAttendanceColor, getAttendanceStatus } from './utils';

export function CourseAttendanceCard({ course }: { course: CourseWithAttendance }) {
  const status = getAttendanceStatus(course.rate);
  const color = getAttendanceColor(course.rate);
  const isLow = course.rate < 75;
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: isLow ? 'rgb(239 68 68 / 0.05)' : 'var(--glass-bg)',
        borderColor: isLow ? 'rgb(239 68 68 / 0.25)' : 'var(--glass-border)',
      }}
    >
      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm ${
        color === 'emerald' ? 'bg-emerald-400 shadow-emerald-400/50' :
        color === 'gold' ? 'bg-amber-400 shadow-amber-400/50' : 'bg-red-400 shadow-red-400/50'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[13px] font-bold text-foreground/90 truncate">{course.title}</p>
          <span className={`text-[13px] font-black tracking-wide flex-shrink-0 ml-2 ${status.cls}`}>
            {course.rate}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={course.rate} variant={color} size="sm" className="flex-1 h-1.5" />
          <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0">{course.attended} / {course.total}</span>
        </div>
      </div>
      {isLow && (
        <div className="h-8 w-8 rounded-full bg-red-400/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-red-400 drop-shadow-sm" />
        </div>
      )}
    </div>
  );
}
