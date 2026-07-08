'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function StudyTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setTimeout(() => {
        setIsActive(false);
        // Automatically switch modes
        if (mode === 'focus') {
          setMode('break');
          setTimeLeft(5 * 60);
        } else {
          setMode('focus');
          setTimeLeft(25 * 60);
        }
      }, 0);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const setFocusMode = () => {
    setMode('focus');
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const setBreakMode = () => {
    setMode('break');
    setIsActive(false);
    setTimeLeft(5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // SVG parameters
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-6 bg-secondary/10 rounded-2xl border border-border/40 relative overflow-hidden group">
      {/* Background glow when active */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-1000 pointer-events-none",
          isActive ? "opacity-20" : ""
        )}
        style={{
          background: mode === 'focus' 
            ? 'radial-gradient(circle at 50% 50%, oklch(0.65 0.26 285) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, oklch(0.70 0.20 165) 0%, transparent 70%)'
        }}
      />

      <div className="flex gap-2 mb-8 relative z-10">
        <button
          onClick={setFocusMode}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-300',
            mode === 'focus' 
              ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_oklch(0.65_0.26_285/0.2)]'
              : 'text-muted-foreground hover:bg-secondary'
          )}
        >
          <Focus className="h-3 w-3" /> Focus (25m)
        </button>
        <button
          onClick={setBreakMode}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-300',
            mode === 'break' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_oklch(0.70_0.20_165/0.2)]'
              : 'text-muted-foreground hover:bg-secondary'
          )}
        >
          <Coffee className="h-3 w-3" /> Break (5m)
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-8">
        {/* SVG Circle */}
        <svg className="w-56 h-56 transform -rotate-90">
          <circle
            cx="112"
            cy="112"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-secondary/40"
          />
          <circle
            cx="112"
            cy="112"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000 ease-linear",
              mode === 'focus' ? 'text-primary' : 'text-emerald-400'
            )}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              filter: isActive ? 'drop-shadow(0 0 8px currentColor)' : 'none'
            }}
          />
        </svg>

        {/* Time Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-black tabular-nums tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold">
            {isActive ? 'Session in progress' : 'Ready to start'}
          </span>
        </div>
      </div>

      <div className="flex gap-4 relative z-10">
        <Button 
          onClick={toggleTimer}
          className={cn(
            "h-12 w-32 rounded-xl font-bold transition-all duration-300 hover:-translate-y-1",
            mode === 'focus' ? (isActive ? 'bg-amber-500 hover:bg-amber-400' : 'bg-primary hover:bg-primary/90') : (isActive ? 'bg-amber-500' : 'bg-emerald-500 hover:bg-emerald-400')
          )}
          style={isActive ? { boxShadow: `0 8px 24px ${mode === 'focus' ? 'oklch(0.75 0.16 85 / 0.4)' : 'oklch(0.75 0.16 85 / 0.4)'}` } : undefined}
        >
          {isActive ? (
            <><Pause className="mr-2 h-4 w-4" /> Pause</>
          ) : (
            <><Play className="mr-2 h-4 w-4" /> Start</>
          )}
        </Button>
        <Button
          onClick={resetTimer}
          variant="outline"
          className="h-12 w-12 rounded-xl p-0 border-border/40 hover:bg-secondary transition-transform hover:rotate-180 duration-500"
          aria-label="Reset Timer"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
