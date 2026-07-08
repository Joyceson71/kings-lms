import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-all duration-200 select-none',
  {
    variants: {
      variant: {
        default:     'bg-cyan-500/12 text-cyan-300 border border-cyan-500/25 shadow-[0_0_10px_oklch(0.72_0.19_195/0.18)]',
        secondary:   'bg-white/6 text-white/55 border border-white/10',
        destructive: 'bg-red-500/12 text-red-400 border border-red-500/25',
        success:     'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25 shadow-[0_0_10px_oklch(0.72_0.20_165/0.18)]',
        warning:     'bg-amber-500/12 text-amber-400 border border-amber-500/25',
        gold:        'bg-amber-400/10 text-amber-300 border border-amber-400/22 shadow-[0_0_10px_oklch(0.80_0.15_80/0.18)]',
        outline:     'border border-white/15 text-white/65',
        ghost:       'text-white/45 hover:text-white/70',
        active:      'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35',
        inactive:    'bg-white/5 text-white/40 border border-white/8',
        faculty:     'bg-violet-500/12 text-violet-300 border border-violet-500/25',
        student:     'bg-sky-500/12 text-sky-300 border border-sky-500/25',
        admin:       'bg-amber-500/12 text-amber-300 border border-amber-500/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' || variant === 'active' ? 'bg-emerald-400 animate-status-pulse' :
            variant === 'destructive' ? 'bg-red-400' :
            variant === 'warning' ? 'bg-amber-400' :
            'bg-cyan-400 animate-status-pulse'
          )}
        />
      )}
      {children}
    </div>
  );
}
