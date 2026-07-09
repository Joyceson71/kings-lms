import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button as ButtonPrimitive } from '@base-ui/react/button';

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-1.5',
    'rounded-md border border-transparent text-[13px] font-medium',
    'transition-all duration-100 outline-none select-none',
    'whitespace-nowrap',
    'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]',
    'disabled:pointer-events-none disabled:opacity-40',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 active:bg-indigo-700',
        outline:
          'bg-transparent text-zinc-300 border-[#2a2a2e] hover:bg-[#1a1a1d] hover:text-white active:bg-[#111113]',
        secondary:
          'bg-[#1a1a1d] text-zinc-300 border-[#2a2a2e] hover:bg-[#222226] hover:text-white active:bg-[#111113]',
        ghost:
          'bg-transparent text-zinc-400 hover:bg-[#111113] hover:text-white active:bg-[#1a1a1d]',
        destructive:
          'bg-red-600/10 text-red-400 border-red-500/20 hover:bg-red-600/20 hover:text-red-300 active:bg-red-600/30',
        link: 'text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300',
      },
      size: {
        default: 'h-8 px-3',
        xs:      'h-6 px-2 text-[11px] rounded',
        sm:      'h-7 px-2.5 text-[12px]',
        lg:      'h-10 px-4 text-sm',
        icon:    'h-8 w-8 p-0',
        'icon-xs': 'h-6 w-6 p-0 rounded',
        'icon-sm': 'h-7 w-7 p-0',
        'icon-lg': 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
