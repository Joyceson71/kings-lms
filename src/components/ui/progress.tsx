import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
  variant?: 'default' | 'emerald' | 'gold' | 'violet' | 'red';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const trackColors: Record<string, string> = {
  default: '#6366f1',
  emerald: '#10b981',
  gold:    '#f59e0b',
  violet:  '#8b5cf6',
  red:     '#ef4444',
};

const sizeClasses = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' };

export function Progress({
  value,
  className,
  variant = 'default',
  showLabel = false,
  size = 'md',
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const color = trackColors[variant] ?? trackColors.default;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-[11px]">
          <span className="text-zinc-500">Progress</span>
          <span className="font-medium text-white">{clamped}%</span>
        </div>
      )}
      <div
        className={cn('w-full rounded-full overflow-hidden', sizeClasses[size])}
        style={{ background: '#1a1a1d' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
    </div>
  );
}
