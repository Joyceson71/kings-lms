import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0–100
  className?: string;
  variant?: 'default' | 'emerald' | 'gold' | 'violet' | 'red';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const variantStyles = {
  default: 'from-primary/80 via-primary to-violet-400',
  emerald: 'from-emerald-600 via-emerald-500 to-emerald-400',
  gold: 'from-amber-600 via-amber-500 to-amber-300',
  violet: 'from-violet-700 via-violet-500 to-fuchsia-400',
  red: 'from-red-700 via-red-500 to-rose-400',
};

const glowStyles = {
  default: 'shadow-[0_0_10px_oklch(0.65_0.26_285/0.5)]',
  emerald: 'shadow-[0_0_10px_oklch(0.7_0.2_165/0.5)]',
  gold: 'shadow-[0_0_10px_oklch(0.78_0.16_85/0.5)]',
  violet: 'shadow-[0_0_10px_oklch(0.65_0.22_295/0.5)]',
  red: 'shadow-[0_0_10px_oklch(0.62_0.22_25/0.5)]',
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function Progress({
  value,
  className,
  variant = 'default',
  showLabel = false,
  size = 'md',
  animated = true,
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold text-foreground">{clampedValue}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-secondary/50 overflow-hidden', sizeStyles[size])}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out',
            variantStyles[variant],
            glowStyles[variant],
            animated && 'animate-gradient-x bg-[length:200%_auto]'
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
