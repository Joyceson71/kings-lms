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
      className="p-5 relative overflow-hidden group hover:border-[#FF006E]/30 transition-all duration-500 bg-[#0D0D1E] shadow-lg hover:shadow-[0_0_24px_rgba(255,0,110,0.2)] hover:-translate-y-1 animate-slide-in-up min-w-0 opacity-0 clip-corner-sm neo-inset border-2 border-[#252545]"
      style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-black text-foreground uppercase brutalist-heading" style={{ fontFamily: "'Outfit', sans-serif" }}>
          My Progress
        </h2>
        <div className="h-10 w-10 rounded-none bg-[#FF006E]/10 border border-[#FF006E]/30 flex items-center justify-center shadow-[0_0_12px_rgba(255,0,110,0.3)] clip-corner">
          <Flame className="h-5 w-5 text-[#FF006E] drop-shadow-[0_0_8px_rgba(255,0,110,0.8)] animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_rgba(255,0,110,0.3)] clip-corner-sm neo-raised"
          style={{ background: 'rgb(255 0 110 / 0.05)', border: '2px solid rgb(255 0 110 / 0.2)' }}
        >
          <div className="text-4xl md:text-5xl font-black text-foreground mb-1 leading-none drop-shadow-sm glitch-text">
            {streak}
          </div>
          <p className="text-[11px] text-[#FF006E] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 mt-2">
            <Flame className="h-3 w-3" />Day Streak
          </p>
          <p className="text-[9px] text-muted-foreground/80 mt-1 font-black uppercase tracking-widest">
            {streak === 0 ? 'Start today!' : streak === 1 ? 'Keep it going!' : `${streak} days strong`}
          </p>
        </div>

        <div
          className="p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_rgba(0,245,255,0.3)] clip-corner-sm neo-raised"
          style={{ background: 'rgb(0 245 255 / 0.05)', border: '2px solid rgb(0 245 255 / 0.2)' }}
        >
          <div className={`text-4xl md:text-5xl font-black mb-1 leading-none drop-shadow-sm glitch-text ${scoreColor}`}>
            {studyScore}
          </div>
          <p className="text-[11px] text-[#00F5FF] font-black uppercase tracking-widest mt-2">
            Study Score
          </p>
          <p className="text-[9px] text-muted-foreground/80 mt-1 font-black uppercase tracking-widest">
            {studyScore >= 80 ? 'Excellent!' : studyScore >= 60 ? 'Good work' : 'Needs attention'}
          </p>
        </div>
      </div>

      <div className="mt-5 bg-[#111120] rounded-sm p-3 border-2 border-[#252545] clip-corner-sm">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-2 font-black uppercase tracking-widest">
          <span>Score breakdown</span>
          <span>60% attend · 40% tasks</span>
        </div>
        <div className="h-2 rounded-none bg-black overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-1000"
            style={{ 
              width: `${studyScore}%`, 
              background: scoreGrad,
              borderRight: '2px solid rgba(255,255,255,0.8)',
              boxShadow: '0 0 10px rgba(255,255,255,0.4)'
            }}
          />
        </div>
      </div>

      <Link
        href="/dashboard/leaderboard"
        className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-[#00F5FF] transition-colors pt-3 font-black uppercase tracking-widest"
        style={{ borderTop: '2px solid #252545' }}
      >
        View Leaderboard <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
