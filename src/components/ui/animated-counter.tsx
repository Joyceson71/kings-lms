'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  target: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

function parseTarget(value: number | string): { num: number; suffix: string } {
  if (typeof value === 'number') return { num: value, suffix: '' };
  // Handle "1,024" → 1024, "89%" → 89 + "%", "42" → 42
  const cleaned = value.replace(/,/g, '');
  const match = cleaned.match(/^([\d.]+)(.*)$/);
  if (match) {
    return { num: parseFloat(match[1]), suffix: match[2] || '' };
  }
  return { num: 0, suffix: value };
}

function formatNumber(n: number, decimals: number, hasCommas: boolean): string {
  const fixed = n.toFixed(decimals);
  if (hasCommas && n >= 1000) {
    return parseFloat(fixed).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return fixed;
}

export function AnimatedCounter({
  target,
  duration = 1500,
  prefix = '',
  suffix: propSuffix = '',
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const { num: targetNum, suffix: parsedSuffix } = parseTarget(target);
  const combinedSuffix = propSuffix || parsedSuffix;
  const hasCommas = typeof target === 'string' && target.includes(',');

  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * targetNum);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isVisible, targetNum, duration]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {formatNumber(displayValue, decimals, hasCommas)}
      {combinedSuffix}
    </span>
  );
}
