import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_oklch(0.65_0.26_285/0.2)]',
        secondary: 'bg-secondary text-secondary-foreground border border-border/50',
        destructive: 'bg-destructive/15 text-destructive border border-destructive/30',
        success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_oklch(0.7_0.2_165/0.2)]',
        warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        gold: 'bg-amber-400/10 text-amber-300 border border-amber-400/25 shadow-[0_0_12px_oklch(0.78_0.16_85/0.2)]',
        outline: 'border border-border text-foreground',
        ghost: 'text-muted-foreground hover:text-foreground',
        active: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
        inactive: 'bg-secondary text-muted-foreground border border-border/50',
        faculty: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
        student: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
        admin: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
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
            variant === 'destructive' ? 'bg-destructive' :
            variant === 'warning' ? 'bg-amber-400' :
            'bg-primary'
          )}
        />
      )}
      {children}
    </div>
  );
}
