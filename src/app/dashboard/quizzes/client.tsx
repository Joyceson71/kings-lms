'use client';

import { Button } from '@/components/ui/button';
import { Zap, Clock, Trophy, PlayCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuizzesClient({ quizzes, isFaculty }: any) {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground brutalist-heading">Quizzes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isFaculty ? 'Manage and create quizzes for your courses.' : 'Test your knowledge and earn XP.'}
          </p>
        </div>
        {isFaculty && (
          <Button className="glow-violet">
            <Plus className="w-4 h-4 mr-2" /> New Quiz
          </Button>
        )}
      </div>

      <div className="grid gap-4 mt-8 md:grid-cols-2">
        {quizzes.map((quiz: any) => (
          <div key={quiz.id} className="glass-card p-6 rounded-xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-md">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{quiz.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {quiz.courses?.title} ({quiz.courses?.code})
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {quiz.duration_minutes} mins
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> Passing: {quiz.passing_score}%
                </div>
              </div>
            </div>

            {!isFaculty && (
              <Button 
                className="w-full bg-white/10 hover:bg-white/20 text-foreground border border-white/10"
                onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/attempt`)}
                disabled={quiz.attempt?.status === 'submitted'}
              >
                {quiz.attempt?.status === 'submitted' ? (
                  `Completed (Score: ${quiz.attempt.score}%)`
                ) : (
                  <><PlayCircle className="w-4 h-4 mr-2" /> Start Quiz</>
                )}
              </Button>
            )}
          </div>
        ))}

        {quizzes.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground glass-card rounded-xl border border-white/5">
            No quizzes available right now.
          </div>
        )}
      </div>
    </div>
  );
}
