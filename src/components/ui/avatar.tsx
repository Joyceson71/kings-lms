import { cn } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  ring?: 'violet' | 'gold' | 'emerald' | 'none';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const ringClasses = {
  violet: 'ring-2 ring-primary ring-offset-2 ring-offset-background',
  gold: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background',
  emerald: 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-background',
  none: '',
};

const glowClasses = {
  violet: 'shadow-[0_0_16px_oklch(0.65_0.26_285/0.5)]',
  gold: 'shadow-[0_0_16px_oklch(0.78_0.16_85/0.5)]',
  emerald: 'shadow-[0_0_16px_oklch(0.7_0.2_165/0.5)]',
  none: '',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function getGradient(name?: string): string {
  const gradients = [
    'from-violet-600 to-fuchsia-500',
    'from-sky-500 to-cyan-400',
    'from-amber-500 to-orange-400',
    'from-emerald-500 to-teal-400',
    'from-rose-500 to-pink-400',
    'from-blue-500 to-indigo-400',
  ];
  const index = (name?.charCodeAt(0) ?? 0) % gradients.length;
  return gradients[index];
}

export function Avatar({ name, src, size = 'md', glow = false, ring = 'none', className }: AvatarProps) {
  const ringStyle = ringClasses[ring];
  const glowStyle = glow ? glowClasses[ring === 'none' ? 'violet' : ring] : '';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full flex-shrink-0',
        sizeClasses[size],
        ringStyle,
        glowStyle,
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? 'Avatar'}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className={cn(
            'h-full w-full rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white',
            getGradient(name)
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
