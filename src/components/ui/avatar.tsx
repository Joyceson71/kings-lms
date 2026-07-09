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
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
};

// Simple deterministic colors for initials avatars
const avatarColors = [
  { bg: '#312e81', text: '#a5b4fc' }, // indigo
  { bg: '#1e3a5f', text: '#7dd3fc' }, // sky
  { bg: '#14532d', text: '#6ee7b7' }, // emerald
  { bg: '#78350f', text: '#fcd34d' }, // amber
  { bg: '#3b1f60', text: '#d8b4fe' }, // violet
  { bg: '#7f1d1d', text: '#fca5a5' }, // red
];

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getColor(name?: string) {
  const idx = (name?.charCodeAt(0) ?? 0) % avatarColors.length;
  return avatarColors[idx];
}

export function Avatar({ name, src, size = 'md', ring = 'none', className }: AvatarProps) {
  const color = getColor(name);

  const ringStyle =
    ring === 'none' ? '' :
    ring === 'violet' ? '0 0 0 2px #0a0a0b, 0 0 0 3px #6366f1' :
    ring === 'gold'   ? '0 0 0 2px #0a0a0b, 0 0 0 3px #f59e0b' :
                        '0 0 0 2px #0a0a0b, 0 0 0 3px #10b981';

  return (
    <div
      className={cn('relative flex items-center justify-center rounded-full flex-shrink-0', sizeClasses[size], className)}
      style={ring !== 'none' ? { boxShadow: ringStyle } : undefined}
    >
      {src ? (
                <img src={src} alt={name ?? 'Avatar'} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div
          className="h-full w-full rounded-full flex items-center justify-center font-semibold"
          style={{ background: color.bg, color: color.text }}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
