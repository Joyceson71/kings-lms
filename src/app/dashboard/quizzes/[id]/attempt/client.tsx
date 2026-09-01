'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function QuizAttemptClient({ quiz, questions, attemptId }: any) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm('You have unanswered questions. Submit anyway?')) return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      
      let marks = 0;
      let totalMarks = 0;
      const inserts = [];

      for (const q of questions) {
        totalMarks += q.marks;
        const selectedOptId = answers[q.id];
        const selectedOpt = q.question_options?.find((o: any) => o.id === selectedOptId);
        const isCorrect = selectedOpt?.is_correct || false;
        
        if (isCorrect) marks += q.marks;

        if (selectedOptId) {
          inserts.push({
            attempt_id: attemptId,
            question_id: q.id,
            selected_option_id: selectedOptId,
            is_correct: isCorrect,
            marks_obtained: isCorrect ? q.marks : 0,
          });
        }
      }

      const scorePercent = totalMarks > 0 ? Math.round((marks / totalMarks) * 100) : 0;

      if (inserts.length > 0) {
        await supabase.from('quiz_answers').insert(inserts);
      }

      await supabase.from('quiz_attempts').update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        score: scorePercent,
      }).eq('id', attemptId);

      if (scorePercent >= quiz.passing_score) {
        await fetch('/api/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'quiz_passed', relatedId: quiz.id })
        });
      }

      toast.success(`Quiz submitted! Your score: ${scorePercent}%`);
      router.push('/dashboard/quizzes');
    } catch (err) {
      toast.error('Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24">
      <div className="glass-card p-6 rounded-xl border border-white/10 mb-8">
        <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
        <p className="text-muted-foreground mt-2">{quiz.description}</p>
      </div>

      <div className="space-y-8">
        {questions.map((q: any, i: number) => (
          <div key={q.id} className="glass-card p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-medium text-foreground mb-4">
              {i + 1}. {q.question_text} <span className="text-muted-foreground text-sm">({q.marks} marks)</span>
            </h3>
            <div className="space-y-3">
              {q.question_options?.map((opt: any) => (
                <label key={opt.id} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === opt.id ? 'bg-primary/20 border-primary/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                  <input 
                    type="radio" 
                    name={q.id} 
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                    className="w-4 h-4 text-primary bg-background border-white/20 focus:ring-primary focus:ring-offset-background"
                  />
                  <span className="text-foreground">{opt.option_text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/10 flex justify-end">
        <Button className="glow-violet px-8" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  );
}
