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
      className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:border-white/10"
      style={{
        background: isLow ? 'rgb(239 68 68 / 0.04)' : 'transparent',
        borderColor: isLow ? 'rgb(239 68 68 / 0.2)' : '#1a1a2e',
      }}
    >
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
        color === 'emerald' ? 'bg-emerald-400' :
        color === 'gold' ? 'bg-amber-400' : 'bg-red-400'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-semibold text-muted-foreground truncate">{course.title}</p>
          <span className={`text-[12px] font-bold flex-shrink-0 ml-2 ${status.cls}`}>
            {course.rate}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={course.rate} variant={color} size="sm" className="flex-1" />
          <span className="text-[9px] text-muted-foreground flex-shrink-0">{course.attended}/{course.total}</span>
        </div>
      </div>
      {isLow && <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
    </div>
  );
}
