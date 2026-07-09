'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, CheckCircle2, Plus, Calendar, AlertCircle, ArrowRight, FileText } from 'lucide-react';

type AssignmentStatus = 'pending' | 'submitted' | 'graded';

interface Assignment {
  id: string;
  title: string;
  course: string;
  code: string;
  due: string;
  status: AssignmentStatus;
  grade?: string;
  description: string;
  icon: string;
}

const columns: { key: AssignmentStatus; label: string; icon: React.ElementType; color: string }[] = [
  {
    key: 'pending',
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-400',
  },
  {
    key: 'submitted',
    label: 'Submitted',
    icon: CheckCircle2,
    color: 'text-indigo-400',
  },
  {
    key: 'graded',
    label: 'Graded',
    icon: AlertCircle,
    color: 'text-emerald-400',
  },
];

function isOverdue(due: string): boolean {
  return new Date(due) < new Date();
}

export default function AssignmentsClient({ initialAssignments, isFaculty }: { initialAssignments: Assignment[], isFaculty: boolean }) {
  const grouped = (key: AssignmentStatus) => initialAssignments.filter((a) => a.status === key);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Assignments
          </h1>
          <p className="text-zinc-400 text-[13px] mt-1">
            {grouped('pending').length} pending · {grouped('submitted').length} submitted · {grouped('graded').length} graded
          </p>
        </div>
        {isFaculty && (
          <Button
            id="add-assignment-btn"
            className="group"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
            New Assignment
          </Button>
        )}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col, colIdx) => {
          const Icon = col.icon;
          const items = grouped(col.key);

          return (
            <div
              key={col.key}
              className="animate-slide-in-up opacity-0 flex flex-col"
              style={{ animationDelay: `${colIdx * 60}ms`, animationFillMode: 'forwards' }}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon className={`h-4 w-4 ${col.color}`} />
                <span className="text-[13px] font-semibold text-white">
                  {col.label}
                </span>
                <span className="ml-auto text-[11px] text-zinc-500 bg-[#1a1a1d] rounded px-1.5 py-0.5 border border-[#2a2a2e]">
                  {items.length}
                </span>
              </div>

              {/* Column container */}
              <div
                className="rounded-lg p-2.5 min-h-[300px] space-y-2.5 flex-1"
                style={{ background: '#0a0a0b', border: '1px solid #1a1a1d' }}
              >
                {items.map((assignment, i) => (
                  <div
                    key={assignment.id}
                    className="rounded-lg p-3 hover:border-indigo-500/50 transition-colors cursor-pointer group animate-fade-in opacity-0"
                    style={{ background: '#111113', border: '1px solid #1f1f23', animationDelay: `${(colIdx * 60) + (i * 40)}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <span className="text-lg leading-none">{assignment.icon}</span>
                      <div className="flex items-center gap-1.5">
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
                    </div>

                    <h3 className="text-[13px] font-semibold text-white mb-1 leading-snug">
                      {assignment.title}
                    </h3>
                    <p className="text-[12px] text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
                      {assignment.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[11px] font-mono text-zinc-500">{assignment.code}</span>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="h-3 w-3 text-zinc-600" />
                        <span className={`font-medium ${
                          assignment.status === 'pending' && isOverdue(assignment.due)
                            ? 'text-red-400'
                            : 'text-zinc-400'
                        }`}>
                          {assignment.due}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderTop: '1px solid #1a1a1d' }}>
                      <span className="text-[11px] text-zinc-500">{assignment.course}</span>
                      <button className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300">
                        View <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FileText className="h-6 w-6 text-zinc-700 mb-2" />
                    <p className="text-[12px] text-zinc-500">No {col.label.toLowerCase()} assignments</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
        <div className="rounded-lg p-4" style={{ background: '#111113', border: '1px solid #1f1f23' }}>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-4 w-4 text-indigo-400" />
            <p className="text-[13px] font-medium text-white">
              You have <span className="text-amber-400">{grouped('pending').length} pending</span> assignments due this week.
              Keep going! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
