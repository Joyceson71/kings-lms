'use client';

import { useState, useEffect } from 'react';
import { X, BookOpen, Clock, Globe, ListChecks, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WebResources } from './web-resources';
import { StudyTimer } from './study-timer';

interface CourseData {
  id: string | number;
  title: string;
  code: string;
  faculty: string;
  students: number;
  category: string;
  status: string;
  rating: number;
  sessions: number;
  color: string;
  glow: string;
  icon: React.ReactNode;
}

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseData | null;
}

export function CourseModal({ isOpen, onClose, course }: CourseModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'web' | 'study' | 'syllabus'>('overview');
  const [completedModules, setCompletedModules] = useState<number[]>([]);

  // Reset state when modal opens for a new course
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setActiveTab('overview');
        // Mock some completed modules based on course ID so it looks realistic
        setCompletedModules([1, 2]);
      }, 0);
    }
  }, [isOpen, course?.id]);

  if (!isOpen || !course) return null;

  const toggleModule = (id: number) => {
    setCompletedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'syllabus', label: 'Syllabus', icon: ListChecks },
    { id: 'web', label: 'Web Resources', icon: Globe },
    { id: 'study', label: 'Study Timer', icon: Clock },
  ] as const;

  // Mock syllabus data
  const syllabusModules = [
    { id: 1, title: 'Introduction and Basic Concepts' },
    { id: 2, title: 'Core Principles & Theory' },
    { id: 3, title: 'Advanced Applications' },
    { id: 4, title: 'Real-world Case Studies' },
    { id: 5, title: 'Final Project & Review' },
  ];

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="fixed inset-4 sm:inset-10 z-50 flex items-center justify-center animate-in zoom-in-95 duration-300 pointer-events-none">
        <div 
          className="w-full max-w-4xl max-h-[90vh] bg-background/95 border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
          style={{
            boxShadow: `0 20px 60px -15px ${course.glow}`,
          }}
        >
          {/* Header */}
          <div className="relative p-6 sm:p-8 border-b border-border/40 overflow-hidden shrink-0">
            {/* Background color bleed */}
            <div 
              className={`absolute inset-0 opacity-10 bg-gradient-to-br ${course.color}`}
            />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4 relative z-10">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-3xl shadow-lg shrink-0`}>
                {course.icon}
              </div>
              <div>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{course.code}</span>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {course.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{course.faculty}</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 px-6 pt-4 shrink-0 overflow-x-auto hide-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all duration-200 border-b-2 whitespace-nowrap',
                    isActive 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="h-px bg-border/40 shrink-0 -mt-px" />

          {/* Content Area */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed">
                  <h3 className="text-foreground text-lg mb-2">About this Course</h3>
                  <p>
                    This is an interactive learning module for <strong>{course.title}</strong>. 
                    It is designed to give you comprehensive theoretical knowledge as well as practical skills.
                    You are currently enrolled with {course.students} other students.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Category', value: course.category },
                    { label: 'Status', value: course.status },
                    { label: 'Rating', value: `${course.rating} / 5.0` },
                    { label: 'Sessions', value: course.sessions },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-secondary/20 border border-border/30 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="font-semibold text-foreground capitalize">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'syllabus' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-foreground font-bold mb-4">Course Syllabus & Progress</h3>
                <div className="space-y-3">
                  {syllabusModules.map((module, i) => {
                    const isCompleted = completedModules.includes(module.id);
                    return (
                      <div 
                        key={module.id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                          isCompleted 
                            ? "bg-emerald-500/10 border-emerald-500/30" 
                            : "bg-secondary/10 border-border/40 hover:border-primary/40"
                        )}
                        onClick={() => toggleModule(module.id)}
                      >
                        <button className="flex-shrink-0 transition-transform duration-300 hover:scale-110">
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground/40" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-mono mb-0.5">Module {i + 1}</p>
                          <p className={cn(
                            "text-sm font-semibold transition-colors duration-300",
                            isCompleted ? "text-emerald-100" : "text-foreground"
                          )}>
                            {module.title}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'web' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <WebResources topic={course.title} />
              </div>
            )}

            {activeTab === 'study' && (
              <div className="flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-foreground font-bold mb-2">Focus Mode</h3>
                <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm">
                  Use this Pomodoro timer to dedicate focused study sessions to {course.code}.
                </p>
                <StudyTimer />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
