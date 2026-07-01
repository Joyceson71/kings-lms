'use client';

import { TiltCard } from '@/components/ui/tilt-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, CheckCircle2, Plus, Calendar, AlertCircle, ArrowRight, FileText } from 'lucide-react';

type AssignmentStatus = 'pending' | 'submitted' | 'graded';

interface Assignment {
  id: number;
  title: string;
  course: string;
  code: string;
  due: string;
  status: AssignmentStatus;
  grade?: string;
  description: string;
  icon: string;
}

const assignments: Assignment[] = [
  {
    id: 1,
    title: 'Binary Tree Implementation',
    course: 'Signals and Systems',
    code: 'EC-301',
    due: 'Jul 5, 2026',
    status: 'pending',
    description: 'Implement AVL tree with insertion, deletion, and balancing.',
    icon: '🌳',
  },
  {
    id: 2,
    title: 'ER Diagram & Normalization',
    course: 'Digital Signal Processing',
    code: 'EC-302',
    due: 'Jul 3, 2026',
    status: 'submitted',
    description: 'Design ER diagram for a library management system up to 3NF.',
    icon: '🗺️',
  },
  {
    id: 3,
    title: 'Integration Calculus Problem Set',
    course: 'Network Analysis',
    code: 'EC-101',
    due: 'Jun 28, 2026',
    status: 'graded',
    grade: 'A+',
    description: 'Solve 20 integration problems using various techniques.',
    icon: '📊',
  },
  {
    id: 4,
    title: 'TCP/IP Socket Programming',
    course: 'Analog Circuits',
    code: 'EC-303',
    due: 'Jul 8, 2026',
    status: 'pending',
    description: 'Build a simple chat application using TCP sockets in Python.',
    icon: '🔌',
  },
  {
    id: 5,
    title: 'Technical Report Writing',
    course: 'Technical Communication',
    code: 'EC-201',
    due: 'Jun 30, 2026',
    status: 'graded',
    grade: 'B+',
    description: 'Write a 1500-word technical report on a chosen engineering topic.',
    icon: '📝',
  },
  {
    id: 6,
    title: 'Shell Script Automation',
    course: 'Microprocessors',
    code: 'EC-304',
    due: 'Jul 12, 2026',
    status: 'pending',
    description: 'Create shell scripts for process management and file operations.',
    icon: '💻',
  },
];

const columns: { key: AssignmentStatus; label: string; icon: React.ElementType; color: string; glowColor: string }[] = [
  {
    key: 'pending',
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-400',
    glowColor: 'oklch(0.75 0.16 85 / 0.2)',
  },
  {
    key: 'submitted',
    label: 'Submitted',
    icon: CheckCircle2,
    color: 'text-sky-400',
    glowColor: 'oklch(0.65 0.2 220 / 0.2)',
  },
  {
    key: 'graded',
    label: 'Graded',
    icon: AlertCircle,
    color: 'text-emerald-400',
    glowColor: 'oklch(0.70 0.20 165 / 0.2)',
  },
];

function isOverdue(due: string): boolean {
  return new Date(due) < new Date();
}

export default function AssignmentsPage() {
  const grouped = (key: AssignmentStatus) => assignments.filter((a) => a.status === key);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Assignments</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {grouped('pending').length} pending · {grouped('submitted').length} submitted · {grouped('graded').length} graded
          </p>
        </div>
        <Button
          id="add-assignment-btn"
          className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0.65_0.26_285/0.4)] transition-all duration-200 group"
        >
          <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          New Assignment
        </Button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((col, colIdx) => {
          const Icon = col.icon;
          const items = grouped(col.key);

          return (
            <div
              key={col.key}
              className="animate-slide-in-up opacity-0"
              style={{ animationDelay: `${colIdx * 100}ms`, animationFillMode: 'forwards' }}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon className={`h-4 w-4 ${col.color}`} />
                <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {col.label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              {/* Column container */}
              <div
                className="rounded-2xl p-3 min-h-[300px] space-y-3 border border-border/30"
                style={{ background: `oklch(0.10 0.02 265 / 0.5)`, boxShadow: `0 4px 24px ${col.glowColor}` }}
              >
                {items.map((assignment, i) => (
                  <div
                    key={assignment.id}
                    className="animate-fade-in opacity-0"
                    style={{ animationDelay: `${(colIdx * 100) + (i * 60)}ms`, animationFillMode: 'forwards' }}
                  >
                    <TiltCard intensity={12}>
                      <div className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                        {/* Emoji + course code */}
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-2xl">{assignment.icon}</span>
                          {assignment.status === 'graded' && assignment.grade && (
                            <Badge variant="gold">Grade: {assignment.grade}</Badge>
                          )}
                          {assignment.status === 'pending' && isOverdue(assignment.due) && (
                            <Badge variant="destructive" dot>Overdue</Badge>
                          )}
                          {assignment.status === 'submitted' && (
                            <Badge variant="default" dot>In Review</Badge>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-foreground mb-1 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {assignment.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {assignment.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-mono text-muted-foreground/70">{assignment.code}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className={`font-medium ${
                              assignment.status === 'pending' && isOverdue(assignment.due)
                                ? 'text-red-400'
                                : 'text-muted-foreground'
                            }`}>
                              {assignment.due}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-muted-foreground">{assignment.course}</span>
                          <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                            View <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </TiltCard>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/20 mb-2" />
                    <p className="text-xs text-muted-foreground/50">No {col.label.toLowerCase()} assignments</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <TiltCard intensity={3} glareEffect={false}>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                You have <span className="text-amber-400">{grouped('pending').length} pending</span> assignments due this week.
                Keep going! 🚀
              </p>
            </div>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
