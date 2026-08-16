import React from 'react';
import Link from 'next/link';
import { Flame, ChevronRight } from 'lucide-react';

export function StreakWidget({ streak, studyScore }: { streak: number; studyScore: number }) {
  const scoreColor =
    studyScore >= 80 ? 'text-emerald-400' :
    studyScore >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreGrad =
    studyScore >= 80 ? 'linear-gradient(90deg, #34d399, transparent)' :
    studyScore >= 60 ? 'linear-gradient(90deg, #fbbf24, transparent)' :
    'linear-gradient(90deg, #f87171, transparent)';

  return (
    <div
      className="bento-card p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-500 backdrop-blur-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 animate-slide-in-up min-w-0 opacity-0"
      style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
          My Progress
        </h2>
        <Flame className="h-4 w-4 text-rose-400 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgb(244 63 94 / 0.06)', border: '1px solid rgb(244 63 94 / 0.15)' }}
        >
          <div className="text-3xl font-black text-foreground mb-0.5 leading-none">
            {streak}
          </div>
          <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
            <Flame className="h-2.5 w-2.5" />Day Streak
          </p>
          <p className="text-[9px] text-muted-foreground mt-1">
            {streak === 0 ? 'Start today!' : streak === 1 ? 'Keep it going!' : `${streak} days strong`}
          </p>
        </div>

        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgb(129 140 248 / 0.06)', border: '1px solid rgb(129 140 248 / 0.15)' }}
        >
          <div className={`text-3xl font-black mb-0.5 leading-none ${scoreColor}`}>
            {studyScore}
          </div>
          <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
            Study Score
          </p>
          <p className="text-[9px] text-muted-foreground mt-1">
            {studyScore >= 80 ? 'Excellent!' : studyScore >= 60 ? 'Good work' : 'Needs attention'}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
          <span>Score breakdown</span>
          <span>60% attend · 40% tasks</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${studyScore}%`, background: scoreGrad }}
          />
        </div>
      </div>

      <Link
        href="/dashboard/leaderboard"
        className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-indigo-400 transition-colors pt-3 border-t border-border"
      >
        View Leaderboard <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
