import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors select-none',
  {
    variants: {
      variant: {
        default:     'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
        secondary:   'bg-[#1a1a1d] text-zinc-500 border border-[#2a2a2e]',
        destructive: 'bg-red-500/10 text-red-400 border border-red-500/20',
        success:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning:     'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        gold:        'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        outline:     'border border-[#2a2a2e] text-zinc-400 bg-transparent',
        ghost:       'text-zinc-500 hover:text-zinc-300 bg-transparent',
        active:      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        inactive:    'bg-[#1a1a1d] text-zinc-600 border border-[#2a2a2e]',
        faculty:     'bg-violet-500/10 text-violet-400 border border-violet-500/20',
        student:     'bg-sky-500/10 text-sky-400 border border-sky-500/20',
        admin:       'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      },
    },
    defaultVariants: { variant: 'default' },
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
            variant === 'success' || variant === 'active'
              ? 'bg-emerald-400 animate-status-pulse'
              : variant === 'destructive'
              ? 'bg-red-400'
              : variant === 'warning' || variant === 'gold'
              ? 'bg-amber-400'
              : 'bg-indigo-400 animate-status-pulse',
          )}
        />
      )}
      {children}
    </div>
  );
}
