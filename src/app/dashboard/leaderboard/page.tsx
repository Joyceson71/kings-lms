'use client';

import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Flame, Crown, Target } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const TOP_STUDENTS = [
  { id: 1, name: 'Alex Johnson', points: 4250, streak: 12, rank: 1, attendance: 98 },
  { id: 2, name: 'Sarah Chen', points: 3980, streak: 8, rank: 2, attendance: 95 },
  { id: 3, name: 'Michael Smith', points: 3750, streak: 15, rank: 3, attendance: 100 },
  { id: 4, name: 'Emily Davis', points: 3420, streak: 5, rank: 4, attendance: 92 },
  { id: 5, name: 'Daniel Raj', points: 3100, streak: 3, rank: 5, attendance: 89 },
];

const BADGES = [
  { id: '1', title: 'Perfect Attendance', desc: '100% attendance this month', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: '2', title: 'Assignment Ace', desc: 'Scored A+ on 5 assignments', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: '3', title: 'Knowledge Seeker', desc: 'Read 20 course resources', icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10' },
];

export default function LeaderboardPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-in-up">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2" >
            <Trophy className="h-8 w-8 text-amber-400" />
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Compete with your peers and earn rewards for academic excellence.</p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/50 p-2 px-4 rounded-xl border border-border/50">
          <Flame className="h-5 w-5 text-rose-500 animate-pulse" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Your Streak</p>
            <p className="text-sm font-bold text-foreground">5 Days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        {TOP_STUDENTS.slice(0, 3).map((student) => (
          <div key={student.id} className={cn(
              "bg-[#111113] border border-[#1f1f23] rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden",
              student.rank === 1 ? "border-amber-500/30 shadow-[0_0_30px_oklch(0.75_0.16_85/0.15)]" :
              student.rank === 2 ? "border-slate-300/30" : "border-amber-700/30"
            )}>
              <div className={cn(
                "absolute top-0 inset-x-0 h-1.5",
                student.rank === 1 ? "bg-gradient-to-r from-amber-300 to-amber-600" :
                student.rank === 2 ? "bg-gradient-to-r from-slate-300 to-slate-500" :
                "bg-gradient-to-r from-amber-700 to-amber-900"
              )} />
              
              {student.rank === 1 && (
                <Crown className="absolute top-4 right-4 h-6 w-6 text-amber-400 opacity-80 rotate-12" />
              )}
              
              <div className="relative mb-4">
                <Avatar name={student.name} size="lg" className="h-20 w-20 text-xl shadow-xl" ring={student.rank === 1 ? 'gold' : 'none'} />
                <div className={cn(
                  "absolute -bottom-3 -right-2 h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 border-background text-primary-foreground",
                  student.rank === 1 ? "bg-amber-500" :
                  student.rank === 2 ? "bg-slate-400" : "bg-amber-700"
                )}>
                  #{student.rank}
                </div>
              </div>
              
              <h3 className="font-bold text-lg mb-1" >{student.name}</h3>
              <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
                {student.points} pts
              </Badge>
              
              <div className="w-full flex justify-between items-center text-xs mt-auto pt-4 border-t border-border/50">
                <div className="text-left">
                  <p className="text-muted-foreground">Attendance</p>
                  <p className="font-semibold text-emerald-400">{student.attendance}%</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Streak</p>
                  <p className="font-semibold text-rose-400">{student.streak} 🔥</p>
                </div>
              </div>
            </div>
          
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <div className="lg:col-span-2 bg-[#111113] border border-[#1f1f23] rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-6" >Global Rankings</h2>
          <div className="space-y-4">
            {TOP_STUDENTS.map((student) => (
              <div key={student.id} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/60 transition-colors">
                <div className="w-8 text-center font-bold text-muted-foreground">#{student.rank}</div>
                <Avatar name={student.name} size="sm" />
                <div className="flex-1">
                  <p className="font-bold text-sm">{student.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{student.points}</p>
                  <p className="text-[10px] text-muted-foreground">Points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111113] border border-[#1f1f23] rounded-3xl p-6 h-fit">
          <h2 className="text-xl font-bold mb-6" >My Badges</h2>
          <div className="space-y-4">
            {BADGES.map((badge) => (
              <div key={badge.id} className="flex items-center gap-4 p-3 rounded-2xl border border-border/30 bg-background/40">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0", badge.bg)}>
                  <badge.icon className={cn("h-6 w-6", badge.color)} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{badge.title}</h4>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
