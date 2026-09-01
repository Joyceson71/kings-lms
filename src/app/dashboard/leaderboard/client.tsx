'use client';

import { Trophy, Medal, Star, Target, TrendingUp } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ParticlesBg } from '@/components/ui/particles-bg';

export default function LeaderboardClient({ leaderboard, currentUserRank, isStudent }: any) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-xl">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground brutalist-heading">Leaderboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Top performers across the college.</p>
        </div>
      </div>

      <div className="grid gap-4 mt-6">
        {leaderboard.map((user: any, idx: number) => {
          const isTop3 = idx < 3;
          return (
            <div 
              key={user.id}
              className={cn(
                "glass-card p-4 rounded-xl border flex items-center gap-4 transition-all hover:bg-white/5",
                isTop3 ? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "border-white/10"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                idx === 0 ? "bg-amber-500/20 text-amber-400" :
                idx === 1 ? "bg-slate-400/20 text-slate-300" :
                idx === 2 ? "bg-orange-700/20 text-orange-400" :
                "bg-white/5 text-muted-foreground"
              )}>
                #{user.rank}
              </div>
              
              <Avatar name={user.name} size="md" />

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{user.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{user.department} • Level {user.level}</p>
              </div>

              <div className="flex flex-col items-end">
                <span className="font-mono font-bold text-primary">{user.xp} XP</span>
              </div>
            </div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No XP data available yet. Start participating to earn XP!
          </div>
        )}
      </div>

      {isStudent && currentUserRank && !leaderboard.find((u: any) => u.id === currentUserRank.id) && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-background/80 backdrop-blur-md border-t border-white/10 z-50">
          <div className="max-w-5xl mx-auto glass-card p-4 rounded-xl border border-primary/30 flex items-center gap-4 shadow-[0_-5px_20px_rgba(124,58,237,0.1)]">
            <div className="w-10 h-10 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center font-bold text-lg">
              #{currentUserRank.rank}
            </div>
            <Avatar name={currentUserRank.name} size="md" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">{currentUserRank.name} (You)</h3>
              <p className="text-xs text-muted-foreground truncate">Level {currentUserRank.level}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono font-bold text-primary">{currentUserRank.xp} XP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
