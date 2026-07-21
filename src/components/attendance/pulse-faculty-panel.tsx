'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle } from 'lucide-react';

type Signal = 'confused' | 'got_it' | 'question';

interface SignalCounts {
  confused: number;
  got_it: number;
  question: number;
  total: number;
}

interface PulseFacultyPanelProps {
  /** The active session_id being monitored */
  sessionId: string;
}

const CONFUSION_ALERT_THRESHOLD = 0.30; // 30%

function countSignalsFromRecent(signals: { signal: Signal }[]): SignalCounts {
  const counts: SignalCounts = { confused: 0, got_it: 0, question: 0, total: 0 };
  signals.forEach(s => {
    counts[s.signal]++;
    counts.total++;
  });
  return counts;
}

/** Sparkline bar — represents signal density over the last N minutes */
function SparkBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-6 bg-[#1a1a1d] rounded-sm overflow-hidden" style={{ height: 48 }}>
        <div
          className={`w-full rounded-sm transition-all duration-700 ${color}`}
          style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
        />
      </div>
      <span className="text-[9px] text-zinc-600">{value}</span>
    </div>
  );
}

export function PulseFacultyPanel({ sessionId }: PulseFacultyPanelProps) {
  const [counts, setCounts] = useState<SignalCounts>({ confused: 0, got_it: 0, question: 0, total: 0 });
  const [isAlert, setIsAlert] = useState(false);
  const [recentWindow, setRecentWindow] = useState<{ signal: Signal; sent_at: string }[]>([]);
  const supabase = createClient();

  // Fetch initial signals
  const fetchSignals = useCallback(async () => {
    const { data } = await supabase
      .from('pulse_signals')
      .select('signal, sent_at')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: false });

    if (data) {
      const all = data as { signal: Signal; sent_at: string }[];
      setRecentWindow(all);
      const c = countSignalsFromRecent(all);
      setCounts(c);
      setIsAlert(c.total > 5 && c.confused / c.total >= CONFUSION_ALERT_THRESHOLD);
    }
  }, [sessionId, supabase]);

  // Subscribe to realtime inserts
  useEffect(() => {
    fetchSignals();

    const channel = supabase
      .channel(`pulse-faculty-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pulse_signals',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newSignal = payload.new as { signal: Signal; sent_at: string };
          setRecentWindow(prev => {
            const updated = [newSignal, ...prev];
            const c = countSignalsFromRecent(updated);
            setCounts(c);
            setIsAlert(c.total > 5 && c.confused / c.total >= CONFUSION_ALERT_THRESHOLD);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchSignals, supabase]);

  // Build a simple 6-bucket timeline (last 6 minutes)
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const now = Date.now();
    const bucketStart = now - (6 - i) * 60_000;
    const bucketEnd = now - (5 - i) * 60_000;
    const inBucket = recentWindow.filter(s => {
      const t = new Date(s.sent_at).getTime();
      return t >= bucketStart && t < bucketEnd;
    });
    return {
      confused: inBucket.filter(s => s.signal === 'confused').length,
      got_it: inBucket.filter(s => s.signal === 'got_it').length,
      question: inBucket.filter(s => s.signal === 'question').length,
      label: `-${6 - i}m`,
    };
  });
  const maxBucketVal = Math.max(1, ...buckets.map(b => b.confused + b.got_it + b.question));
  const confusedPct = counts.total > 0 ? Math.round((counts.confused / counts.total) * 100) : 0;
  const gotItPct = counts.total > 0 ? Math.round((counts.got_it / counts.total) * 100) : 0;
  const questionPct = counts.total > 0 ? Math.round((counts.question / counts.total) * 100) : 0;

  return (
    <div
      className="rounded-xl border p-4 space-y-4 transition-all duration-500"
      style={{
        background: isAlert ? 'rgb(239 68 68 / 0.05)' : '#0d0d0f',
        borderColor: isAlert ? 'rgb(239 68 68 / 0.4)' : '#1f1f23',
        boxShadow: isAlert ? '0 0 30px rgb(239 68 68 / 0.12)' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-xs font-semibold text-zinc-300">Class Pulse</p>
        </div>
        <p className="text-[10px] text-zinc-600">{counts.total} signals</p>
      </div>

      {/* Alert Banner */}
      {isAlert && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 animate-bounce-in">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
          <p className="text-[11px] text-rose-300 font-semibold">
            {confusedPct}% of students are confused — consider pausing!
          </p>
        </div>
      )}

      {/* Live Signal Bars */}
      {counts.total === 0 ? (
        <p className="text-center text-[11px] text-zinc-600 py-3">Waiting for student signals…</p>
      ) : (
        <div className="space-y-2">
          {/* Confused */}
          <div className="flex items-center gap-2">
            <span className="text-sm w-5 text-center">🤔</span>
            <div className="flex-1 bg-[#1a1a1d] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-700"
                style={{ width: `${confusedPct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 w-8 text-right">{confusedPct}%</span>
          </div>
          {/* Got it */}
          <div className="flex items-center gap-2">
            <span className="text-sm w-5 text-center">✅</span>
            <div className="flex-1 bg-[#1a1a1d] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${gotItPct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 w-8 text-right">{gotItPct}%</span>
          </div>
          {/* Question */}
          <div className="flex items-center gap-2">
            <span className="text-sm w-5 text-center">💡</span>
            <div className="flex-1 bg-[#1a1a1d] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${questionPct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 w-8 text-right">{questionPct}%</span>
          </div>
        </div>
      )}

      {/* Timeline Sparkline */}
      {counts.total > 0 && (
        <div>
          <p className="text-[9px] text-zinc-700 mb-1 uppercase tracking-wider">Signal timeline</p>
          <div className="flex items-end gap-1.5">
            {buckets.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end gap-0.5 w-full">
                  <SparkBar value={b.confused} max={maxBucketVal} color="bg-rose-500/70" />
                  <SparkBar value={b.got_it} max={maxBucketVal} color="bg-emerald-500/70" />
                  <SparkBar value={b.question} max={maxBucketVal} color="bg-amber-500/70" />
                </div>
                <span className="text-[8px] text-zinc-700">{b.label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="flex items-end gap-0.5 w-full">
                <SparkBar value={recentWindow.filter(s => {
                  const t = new Date(s.sent_at).getTime();
                  return t > Date.now() - 60_000 && s.signal === 'confused';
                }).length} max={maxBucketVal} color="bg-rose-500/70" />
                <SparkBar value={recentWindow.filter(s => {
                  const t = new Date(s.sent_at).getTime();
                  return t > Date.now() - 60_000 && s.signal === 'got_it';
                }).length} max={maxBucketVal} color="bg-emerald-500/70" />
                <SparkBar value={recentWindow.filter(s => {
                  const t = new Date(s.sent_at).getTime();
                  return t > Date.now() - 60_000 && s.signal === 'question';
                }).length} max={maxBucketVal} color="bg-amber-500/70" />
              </div>
              <span className="text-[8px] text-zinc-500 font-semibold">Now</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
