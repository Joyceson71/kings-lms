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
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>
          My Progress
        </h2>
        <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
          <Flame className="h-4 w-4 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-lg"
          style={{ background: 'rgb(244 63 94 / 0.05)', border: '1px solid rgb(244 63 94 / 0.15)' }}
        >
          <div className="text-4xl md:text-5xl font-black text-foreground mb-1 leading-none drop-shadow-sm">
            {streak}
          </div>
          <p className="text-[11px] text-rose-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 mt-2">
            <Flame className="h-3 w-3" />Day Streak
          </p>
          <p className="text-[10px] text-muted-foreground/80 mt-1 font-medium">
            {streak === 0 ? 'Start today!' : streak === 1 ? 'Keep it going!' : `${streak} days strong`}
          </p>
        </div>

        <div
          className="rounded-2xl p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-lg"
          style={{ background: 'rgb(129 140 248 / 0.05)', border: '1px solid rgb(129 140 248 / 0.15)' }}
        >
          <div className={`text-4xl md:text-5xl font-black mb-1 leading-none drop-shadow-sm ${scoreColor}`}>
            {studyScore}
          </div>
          <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest mt-2">
            Study Score
          </p>
          <p className="text-[10px] text-muted-foreground/80 mt-1 font-medium">
            {studyScore >= 80 ? 'Excellent!' : studyScore >= 60 ? 'Good work' : 'Needs attention'}
          </p>
        </div>
      </div>

      <div className="mt-5 bg-white/5 rounded-xl p-3 border border-white/5">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-2 font-medium">
          <span>Score breakdown</span>
          <span>60% attend · 40% tasks</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
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
