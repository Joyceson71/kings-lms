import React from 'react';
import Link from 'next/link';
import { ScanLine, Zap } from 'lucide-react';
import { ActiveSession } from './types';

export function ActiveSessionBanner({ sessions }: { sessions: ActiveSession[] }) {
  if (sessions.length === 0) return null;
  const session = sessions[0];
  return (
    <Link
      href={`/dashboard/attendance?token=${session.qr_token}`}
      className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/8 hover:bg-emerald-500/12 transition-all duration-200 group animate-slide-in-up opacity-0"
      style={{ animationFillMode: 'forwards', background: 'linear-gradient(135deg, rgb(16 185 129 / 0.08), rgb(52 211 153 / 0.04))' }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <ScanLine className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-border animate-status-pulse" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-300">Class is LIVE right now!</p>
          <p className="text-xs text-emerald-500/80">
            {session.courses?.title ?? 'Class'} • {session.room ?? 'Unknown room'} — tap to mark attendance
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-emerald-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
        <Zap className="h-4 w-4" />
        <span className="text-xs font-bold hidden sm:block">Mark Now</span>
      </div>
    </Link>
  );
}
