'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type Signal = 'confused' | 'got_it' | 'question';

interface PulseStudentWidgetProps {
  /** The active session_id the student is currently in */
  sessionId: string;
}

const SIGNALS: { type: Signal; emoji: string; label: string; color: string; activeColor: string; glow: string }[] = [
  {
    type: 'confused',
    emoji: '🤔',
    label: 'Confused',
    color: 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10',
    activeColor: 'border-rose-500 bg-rose-500/20 text-rose-300',
    glow: '0 0 20px rgb(244 63 94 / 0.35)',
  },
  {
    type: 'got_it',
    emoji: '✅',
    label: 'Got it!',
    color: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
    activeColor: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
    glow: '0 0 20px rgb(16 185 129 / 0.35)',
  },
  {
    type: 'question',
    emoji: '💡',
    label: 'Question',
    color: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
    activeColor: 'border-amber-500 bg-amber-500/20 text-amber-300',
    glow: '0 0 20px rgb(245 158 11 / 0.35)',
  },
];

/** Rate limit: one signal per 30 seconds */
const RATE_LIMIT_MS = 30_000;

export function PulseStudentWidget({ sessionId }: PulseStudentWidgetProps) {
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [lastSignal, setLastSignal] = useState<Signal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Live countdown timer
  useEffect(() => {
    if (!lastSentAt) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastSentAt;
      const remaining = Math.max(0, RATE_LIMIT_MS - elapsed);
      setCooldownLeft(Math.ceil(remaining / 1000));
      if (remaining === 0) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [lastSentAt]);

  const sendSignal = useCallback(async (signal: Signal) => {
    // Rate limiting
    if (lastSentAt && Date.now() - lastSentAt < RATE_LIMIT_MS) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ session_id: sessionId, signal }),
      });

      setLastSignal(signal);
      setLastSentAt(Date.now());
      setCooldownLeft(RATE_LIMIT_MS / 1000);

      // Show confirmation toast
      setShowConfirm(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setShowConfirm(false), 2500);
    } catch (err) {
      console.error('Failed to send pulse signal:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [lastSentAt, isSubmitting, sessionId, supabase]);

  const isCoolingDown = cooldownLeft > 0;

  return (
    <div className="relative">
      {/* Confirmation toast */}
      {showConfirm && lastSignal && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#111113] border border-[#2a2a2e] rounded-xl px-3 py-1.5 text-xs font-medium text-white animate-bounce-in z-10"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
        >
          {SIGNALS.find(s => s.type === lastSignal)?.emoji} Signal sent anonymously!
        </div>
      )}

      <div className="bg-[#0d0d0f] border border-[#1f1f23] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Live Class Pulse</p>
        </div>

        <p className="text-[12px] text-zinc-600 mb-3">How are you following along? (Anonymous)</p>

        <div className="grid grid-cols-3 gap-2">
          {SIGNALS.map(({ type, emoji, label, color, activeColor, glow }) => {
            const isActive = lastSignal === type && isCoolingDown;
            return (
              <button
                key={type}
                onClick={() => sendSignal(type)}
                disabled={isCoolingDown || isSubmitting}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[11px] font-medium transition-all duration-200 ${isActive ? activeColor : color} disabled:opacity-40 disabled:cursor-not-allowed`}
                style={isActive ? { boxShadow: glow } : undefined}
              >
                <span className="text-xl leading-none">{emoji}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {isCoolingDown && (
          <p className="text-center text-[10px] text-zinc-600 mt-2">
            Next signal in {cooldownLeft}s
          </p>
        )}
      </div>
    </div>
  );
}
