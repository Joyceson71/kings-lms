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
        className="flex items-center justify-between gap-3 p-5 rounded-2xl border border-emerald-500/50 hover:border-emerald-400/80 transition-all duration-300 group animate-slide-in-up opacity-0 shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] hover:-translate-y-1 overflow-hidden relative"
        style={{ animationFillMode: 'forwards', background: 'linear-gradient(135deg, rgb(16 185 129 / 0.15), rgb(52 211 153 / 0.05))' }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <ScanLine className="h-6 w-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-background animate-ping" style={{ animationDuration: '2s' }} />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-background" />
          </div>
          <div>
            <p className="text-[15px] font-black text-emerald-300 tracking-wide drop-shadow-sm uppercase">Class is LIVE right now!</p>
            <p className="text-[13px] font-medium text-emerald-100/70 mt-0.5">
              {session.courses?.title ?? 'Class'} • {session.room ?? 'Unknown room'} — Tap to mark attendance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30 group-hover:scale-105 transition-all flex-shrink-0 border border-emerald-500/30">
          <Zap className="h-4 w-4 drop-shadow-sm" />
          <span className="text-[13px] font-bold hidden sm:block tracking-wide">Mark Now</span>
        </div>
      </Link>
  );
}
