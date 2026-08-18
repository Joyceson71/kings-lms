'use client';

import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, CheckCircle2, Plus, AlertCircle, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

import { SubmissionModal } from '@/components/assignments/submission-modal';
import { CreateAssignmentModal } from '@/components/assignments/create-assignment-modal';
import { AssignmentColumn } from '@/components/assignments/assignment-column';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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

const columns: { key: AssignmentStatus; label: string; icon: React.ElementType<any>; color: string }[] = [
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



export default function AssignmentsClient({ initialAssignments, isFaculty }: { initialAssignments: Assignment[], isFaculty: boolean }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [smartSort, setSmartSort] = useState(false);

  // ─── Smart Sort: urgency score (higher = more urgent) ────────────────────
  const urgencyScore = (a: Assignment): number => {
    if (a.status !== 'pending') return 0;
    const due = new Date(a.due).getTime();
    const now = Date.now();
    if (isNaN(due)) return 0;
    const daysUntilDue = (due - now) / 86400000;
    if (daysUntilDue < 0) return 1000 + Math.abs(daysUntilDue); // overdue → top priority
    return 100 - daysUntilDue; // closer deadline → higher score
  };

  const grouped = (key: AssignmentStatus) => {
    const items = assignments.filter(a => a.status === key);
    if (smartSort && key === 'pending') {
      return [...items].sort((a, b) => urgencyScore(b) - urgencyScore(a));
    }
    return items;
  };

  const handleGradeSubmit = async (assignment: Assignment) => {
    const grade = parseInt(gradeInput, 10);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error('Please enter a grade between 0 and 100.');
      return;
    }
    setIsSavingGrade(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('submissions').upsert({
        assignment_id: assignment.id,
        grade,
        feedback: feedbackInput.trim() || null,
        status: 'graded',
        graded_at: new Date().toISOString(),
      }, { onConflict: 'assignment_id' });
      if (error) throw error;
      setAssignments(prev => prev.map(a =>
        a.id === assignment.id
          ? { ...a, status: 'graded' as AssignmentStatus, grade: `${grade}/100` }
          : a
      ));
      toast.success(`Graded "${assignment.title}" — ${grade}/100`);
      setGradingId(null);
      setGradeInput('');
      setFeedbackInput('');
    } catch {
      toast.error('Failed to save grade. Please try again.');
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleSubmissionSuccess = (assignmentId: string) => {
    setAssignments(prev => prev.map(a => 
      a.id === assignmentId ? { ...a, status: 'submitted' as AssignmentStatus } : a
    ));
  };

  const handleCreateSuccess = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Assignments
          </h1>
          <p className="text-muted-foreground text-[13px] mt-1">
            {grouped('pending').length} pending · {grouped('submitted').length} submitted · {grouped('graded').length} graded
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Smart Sort toggle — students only */}
          {!isFaculty && (
            <button
              onClick={() => setSmartSort(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all duration-200 ${
                smartSort
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-transparent border-border text-muted-foreground hover:text-muted-foreground hover:border-border'
              }`}
              title="Sort pending assignments by urgency: overdue first, then by closest deadline"
            >
              {smartSort ? <X className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              Smart Sort
              {smartSort && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </button>
          )}
          {isFaculty && (
            <Button
              id="add-assignment-btn"
              className="group"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
              New Assignment
            </Button>
          )}
        </div>
      </div>

      {/* Smart Sort info banner */}
      {smartSort && !isFaculty && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] text-indigo-300 animate-fade-in opacity-0"
          style={{ background: 'rgb(99 102 241 / 0.06)', border: '1px solid rgb(99 102 241 / 0.15)', animationFillMode: 'forwards' }}
        >
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Pending assignments sorted by urgency — overdue first, then closest deadline.</span>
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col, colIdx) => {
          const items = grouped(col.key);

          return (
            <AssignmentColumn
              key={col.key}
              col={col}
              items={items}
              colIdx={colIdx}
              isFaculty={isFaculty}
              gradingId={gradingId}
              setGradingId={setGradingId}
              gradeInput={gradeInput}
              setGradeInput={setGradeInput}
              feedbackInput={feedbackInput}
              setFeedbackInput={setFeedbackInput}
              handleGradeSubmit={handleGradeSubmit}
              isSavingGrade={isSavingGrade}
              setSelectedAssignment={setSelectedAssignment}
              setIsSubmissionModalOpen={setIsSubmissionModalOpen}
            />
          );
        })}
      </div>

      {/* Summary */}
      <div className="animate-slide-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
        <div className="rounded-lg p-4" style={{ background: '#111113', border: '1px solid #1f1f23' }}>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-4 w-4 text-indigo-400" />
            <p className="text-[13px] font-medium text-foreground">
              You have <span className="text-amber-400">{grouped('pending').length} pending</span> assignments due this week.
              Keep going! 🚀
            </p>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <SubmissionModal 
        assignment={selectedAssignment}
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        onSuccess={handleSubmissionSuccess}
      />
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
