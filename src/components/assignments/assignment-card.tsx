import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Star, Loader2, ArrowRight } from 'lucide-react';

function isOverdue(due: string): boolean {
  return new Date(due) < new Date();
}

export function AssignmentCard({
  assignment,
  isFaculty,
  gradingId,
  setGradingId,
  gradeInput,
  setGradeInput,
  feedbackInput,
  setFeedbackInput,
  handleGradeSubmit,
  isSavingGrade,
  onClick,
  style
}: any) {
  return (
    <div
      className="rounded-lg p-3 hover:border-indigo-500/50 transition-colors cursor-pointer group animate-fade-in opacity-0"
      style={{ background: '#111113', border: '1px solid #1f1f23', animationFillMode: 'forwards', ...style }}
      onClick={onClick}
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

      <h3 className="text-[13px] font-semibold text-foreground mb-1 leading-snug">
        {assignment.title}
      </h3>
      <p className="text-[12px] text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
        {assignment.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] font-mono text-muted-foreground">{assignment.code}</span>
        <div className="flex items-center gap-1.5 text-[11px]">
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

      {isFaculty && gradingId === assignment.id ? (
        <div
          className="mt-3 pt-3 space-y-2"
          style={{ borderTop: '1px solid #1a1a1d' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Grade (0-100)"
              value={gradeInput}
              onChange={e => setGradeInput(e.target.value)}
              className="h-8 text-xs bg-background/40 border-border/40 rounded-lg flex-1"
            />
            <Button
              size="sm"
              onClick={() => handleGradeSubmit(assignment)}
              disabled={isSavingGrade}
              className="h-8 px-3 rounded-lg text-xs"
            >
              {isSavingGrade ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setGradingId(null)}
              className="h-8 px-2 rounded-lg text-xs"
            >
              ✕
            </Button>
          </div>
          <textarea
            placeholder="Feedback (optional)"
            value={feedbackInput}
            onChange={e => setFeedbackInput(e.target.value)}
            rows={2}
            className="w-full resize-none text-xs rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary/50 outline-none"
          />
        </div>
      ) : (
        <div
          className="mt-3 pt-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderTop: '1px solid #1a1a1d' }}
        >
          <span className="text-[11px] text-muted-foreground">{assignment.course}</span>
          {isFaculty ? (
            <button
              className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300"
              onClick={e => {
                e.stopPropagation();
                setGradingId(assignment.id);
                setGradeInput('');
                setFeedbackInput('');
              }}
            >
              <Star className="h-3 w-3" /> Grade
            </button>
          ) : (
            <button className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300">
              View <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
