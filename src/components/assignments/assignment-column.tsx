import { FileText } from 'lucide-react';
import { AssignmentCard } from './assignment-card';

export function AssignmentColumn({
  col,
  items,
  isFaculty,
  gradingId,
  setGradingId,
  gradeInput,
  setGradeInput,
  feedbackInput,
  setFeedbackInput,
  handleGradeSubmit,
  isSavingGrade,
  setSelectedAssignment,
  setIsSubmissionModalOpen,
  colIdx
}: any) {
  const Icon = col.icon;
  return (
    <div
      className="animate-slide-in-up opacity-0 flex flex-col"
      style={{ animationDelay: `${colIdx * 60}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className={`h-4 w-4 ${col.color}`} />
        <span className="text-[13px] font-semibold text-foreground">
          {col.label}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 border border-border">
          {items.length}
        </span>
      </div>

      <div
        className="rounded-lg p-2.5 min-h-[300px] space-y-2.5 flex-1"
        style={{ background: '#0a0a0b', border: '1px solid #1a1a1d' }}
      >
        {items.map((assignment: any, i: number) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            isFaculty={isFaculty}
            gradingId={gradingId}
            setGradingId={setGradingId}
            gradeInput={gradeInput}
            setGradeInput={setGradeInput}
            feedbackInput={feedbackInput}
            setFeedbackInput={setFeedbackInput}
            handleGradeSubmit={handleGradeSubmit}
            isSavingGrade={isSavingGrade}
            style={{ animationDelay: `${(colIdx * 60) + (i * 40)}ms` }}
            onClick={() => {
              if (!isFaculty) {
                setSelectedAssignment(assignment);
                setIsSubmissionModalOpen(true);
              }
            }}
          />
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-[12px] text-muted-foreground">No {col.label.toLowerCase()} assignments</p>
          </div>
        )}
      </div>
    </div>
  );
}
