'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { TiltCard } from '@/components/ui/tilt-card';

const SCHEDULE = [
  { id: 1, title: 'Signals and Systems', time: '10:00 AM - 11:30 AM', type: 'Lecture', room: 'Room 402', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dayOffset: 0 },
  { id: 2, title: 'Digital Signal Processing', time: '1:00 PM - 2:30 PM', type: 'Lab', room: 'Lab 2A', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20', dayOffset: 0 },
  { id: 3, title: 'Network Analysis', time: '9:00 AM - 10:30 AM', type: 'Lecture', room: 'Room 301', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dayOffset: 1 },
  { id: 4, title: 'Analog Circuits', time: '11:00 AM - 12:30 PM', type: 'Tutorial', room: 'Room 105', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', dayOffset: 2 },
  { id: 5, title: 'Microprocessors Lab', time: '2:00 PM - 5:00 PM', type: 'Lab', room: 'Hardware Lab', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dayOffset: 3 },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i)); // Mon-Fri

  return (
    <div className="space-y-8 h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <CalendarIcon className="h-7 w-7 text-primary" />
            <span className="gradient-text">Schedule</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your weekly classes, labs, and tutorials.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="rounded-xl border-border/50 hover:bg-secondary">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 font-semibold bg-secondary/50 rounded-xl border border-border/50 text-sm w-36 text-center">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 4), 'MMM d, yyyy')}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="rounded-xl border-border/50 hover:bg-secondary">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 bg-secondary/20 rounded-3xl border border-border/50 overflow-hidden flex flex-col animate-slide-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        
        {/* Days Header */}
        <div className="grid grid-cols-5 border-b border-border/50 bg-secondary/40 flex-shrink-0">
          {weekDays.map((day, i) => (
            <div key={i} className="p-4 text-center border-r border-border/50 last:border-r-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{format(day, 'EEE')}</p>
              <p className={cn(
                "text-2xl font-black mt-1",
                isSameDay(day, new Date()) ? "text-primary drop-shadow-[0_0_8px_oklch(0.65_0.26_285/0.5)]" : "text-foreground"
              )} style={{ fontFamily: 'Outfit, sans-serif' }}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Timetable Body */}
        <div className="flex-1 grid grid-cols-5 overflow-y-auto scrollbar-thin">
          {weekDays.map((day, colIndex) => {
            const daysEvents = SCHEDULE.filter(e => e.dayOffset === colIndex);
            
            return (
              <div key={colIndex} className="border-r border-border/50 last:border-r-0 p-3 flex flex-col gap-3">
                {daysEvents.map((event) => (
                  <TiltCard key={event.id} intensity={5} glareEffect={false}>
                    <div className={cn(
                      "p-3 rounded-2xl border flex flex-col cursor-pointer transition-all hover:scale-[1.02]",
                      event.color
                    )}>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">{event.type}</p>
                      <h4 className="font-bold text-sm leading-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {event.title}
                      </h4>
                      <div className="mt-auto space-y-1.5 opacity-90 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          <span>{event.room}</span>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
