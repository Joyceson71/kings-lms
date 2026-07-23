'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, X, Play, Pause, RotateCcw, Coffee, Brain, ChevronUp, ChevronDown } from 'lucide-react';

const WORK_MINS = 25;
const BREAK_MINS = 5;

type Phase = 'work' | 'break';

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Radial SVG progress ring ─────────────────────────────────────────────────
function Ring({ pct, phase }: { pct: number; phase: Phase }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = phase === 'work' ? '#818cf8' : '#34d399';

  return (
    <svg width="100" height="100" className="absolute inset-0 m-auto rotate-[-90deg]">
      <circle cx="50" cy="50" r={r} strokeWidth="4" fill="none" stroke="rgba(255,255,255,0.04)" />
      <circle
        cx="50" cy="50" r={r} strokeWidth="4" fill="none"
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
    </svg>
  );
}

export function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [phase, setPhase] = useState<Phase>('work');
  const [secs, setSecs] = useState(WORK_MINS * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSecs = phase === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60;
  const pct = secs / totalSecs;
  const phaseColor = phase === 'work' ? '#818cf8' : '#34d399';

  // Load persisted session count from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pomodoro_sessions');
      if (stored) setSessions(parseInt(stored, 10) || 0);
    } catch {}
  }, []);

  const tick = useCallback(() => {
    setSecs(s => {
      if (s <= 1) {
        // Phase complete
        setRunning(false);
        clearInterval(intervalRef.current!);
        const nextPhase: Phase = phase === 'work' ? 'break' : 'work';
        setPhase(nextPhase);
        setSecs(nextPhase === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60);
        if (phase === 'work') {
          setSessions(prev => {
            const next = prev + 1;
            try { localStorage.setItem('pomodoro_sessions', String(next)); } catch {}
            return next;
          });
        }
        // Browser notification (if granted)
        try {
          new Notification(phase === 'work' ? '🎉 Focus session done! Take a break.' : '💪 Break over — back to work!', {
            icon: '/favicon.ico',
          });
        } catch {}
        return 0;
      }
      return s - 1;
    });
  }, [phase]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, tick]);

  const toggle = () => {
    if (!running && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    setRunning(r => !r);
  };

  const reset = () => {
    setRunning(false);
    setSecs(phase === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60);
  };

  const switchPhase = (p: Phase) => {
    setRunning(false);
    setPhase(p);
    setSecs(p === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
        style={{
          background: 'rgba(4,4,12,0.9)',
          border: '1px solid rgba(129,140,248,0.25)',
          color: '#818cf8',
          backdropFilter: 'blur(10px)',
        }}
        title="Open Pomodoro Focus Timer"
      >
        <Timer className="h-3.5 w-3.5" />
        <span>Focus</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-24 right-4 md:bottom-6 z-50 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        width: 220,
        background: 'rgba(8,8,24,0.96)',
        border: '1px solid rgba(129,140,248,0.2)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5" style={{ color: phaseColor }} />
          <span className="text-[12px] font-bold" style={{ color: phaseColor, fontFamily: "'Outfit', sans-serif" }}>
            Pomodoro
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(m => !m)}
            className="h-5 w-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isMinimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <button
            onClick={() => { setIsOpen(false); setRunning(false); }}
            className="h-5 w-5 flex items-center justify-center rounded text-slate-500 hover:text-red-400 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4">
          {/* Phase tabs */}
          <div
            className="flex rounded-lg p-0.5 mb-4 gap-0.5"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {(['work', 'break'] as Phase[]).map(p => (
              <button
                key={p}
                onClick={() => switchPhase(p)}
                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-semibold transition-all duration-200"
                style={{
                  background: phase === p ? (p === 'work' ? 'rgba(129,140,248,0.15)' : 'rgba(52,211,153,0.15)') : 'transparent',
                  color: phase === p ? (p === 'work' ? '#818cf8' : '#34d399') : '#64748b',
                }}
              >
                {p === 'work' ? <Brain className="h-2.5 w-2.5" /> : <Coffee className="h-2.5 w-2.5" />}
                {p === 'work' ? 'Focus' : 'Break'}
              </button>
            ))}
          </div>

          {/* Clock face */}
          <div className="relative h-[100px] flex items-center justify-center mb-4">
            <Ring pct={pct} phase={phase} />
            <div className="relative z-10 text-center">
              <div
                className="text-2xl font-black tracking-tight tabular-nums"
                style={{ color: phaseColor, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}
              >
                {formatTime(secs)}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest">
                {phase === 'work' ? 'Focus time' : 'Break time'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={reset}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              title="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={toggle}
              className="h-9 w-16 flex items-center justify-center rounded-xl font-bold text-[12px] transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                background: running
                  ? 'rgba(248,113,113,0.15)'
                  : (phase === 'work' ? 'rgba(129,140,248,0.2)' : 'rgba(52,211,153,0.2)'),
                color: running ? '#f87171' : phaseColor,
                border: `1px solid ${running ? 'rgba(248,113,113,0.3)' : `${phaseColor}44`}`,
              }}
            >
              {running
                ? <Pause className="h-4 w-4" />
                : <Play className="h-4 w-4 ml-0.5" />}
            </button>
          </div>

          {/* Session count */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-[10px] text-slate-500 font-medium">Sessions today</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: i < sessions ? '#818cf8' : 'rgba(255,255,255,0.1)' }}
                />
              ))}
              {sessions > 8 && <span className="text-[10px] text-indigo-400 font-bold ml-1">+{sessions - 8}</span>}
              {sessions === 0 && <span className="text-[10px] text-slate-600">—</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
