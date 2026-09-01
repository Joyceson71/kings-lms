import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CourseWithAttendance } from './types';
export function CourseAttendanceCard({ course }: { course: CourseWithAttendance }) {
  const isLow = course.rate < 75;
  const hexColor = course.rate >= 80 ? '#39FF14' : course.rate >= 75 ? '#FFD700' : '#FF006E';

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg clip-corner-sm neo-inset"
      style={{
        background: isLow ? 'rgb(255 0 110 / 0.1)' : '#111120',
        borderColor: isLow ? '#FF006E' : '#252545',
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: isLow ? '4px 4px 0 rgb(255 0 110 / 0.3)' : '4px 4px 0 rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="h-3 w-3 rounded-full flex-shrink-0 animate-status-pulse" style={{ background: hexColor, boxShadow: `0 0 10px ${hexColor}` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[12px] font-black text-foreground uppercase tracking-widest truncate glitch-text">{course.title}</p>
          <span className="text-[14px] font-black tracking-tight flex-shrink-0 ml-2" style={{ color: hexColor, textShadow: `0 0 8px ${hexColor}88` }}>
            {course.rate}%
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {/* Anime Power Meter Progress */}
          <div className="flex-1 h-2 bg-black overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 transition-all duration-500"
              style={{
                width: `${course.rate}%`,
                background: `linear-gradient(90deg, ${hexColor}, transparent)`,
                borderRight: `2px solid ${hexColor}`,
                boxShadow: `0 0 12px ${hexColor}`
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground flex-shrink-0 tracking-widest uppercase">{course.attended} / {course.total}</span>
        </div>
      </div>
      {isLow && (
        <div className="h-8 w-8 bg-[#FF006E]/10 flex items-center justify-center flex-shrink-0 border border-[#FF006E]/30" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
          <AlertTriangle className="h-4 w-4 text-[#FF006E] animate-pulse" />
        </div>
      )}
    </div>
  );

}
