'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CheckCircle, BookOpen, ClipboardList, Settings, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

const mobileNavItems = [
  { name: 'Home',        href: '/dashboard',             icon: LayoutDashboard },
  { name: 'IV Tracker',  href: '/dashboard/iv-tracker',  icon: MapPin },
  { name: 'Attendance',  href: '/dashboard/attendance',  icon: CheckCircle },
  { name: 'Courses',     href: '/dashboard/courses',     icon: BookOpen },
  { name: 'Settings',    href: '/dashboard/settings',    icon: Settings },
];

export const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden flex justify-center pointer-events-none">
      <nav
        className="flex items-stretch bg-gradient-to-r from-indigo-950/80 via-black/80 to-purple-950/80 backdrop-blur-3xl rounded-[2rem] border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto px-2"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-stretch w-full max-w-md mx-auto py-1">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors duration-150',
                active ? 'text-indigo-300' : 'text-muted-foreground',
              )}
            >
              {/* Neon top indicator */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-10 rounded-b-full bg-gradient-to-r from-pink-400 to-purple-400 shadow-[0_0_15px_rgba(236,72,153,0.8)]"
                />
              )}

              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl transition-all duration-150',
                  active ? 'w-10 h-8 bg-white/10 shadow-inner border border-white/10' : 'w-8 h-8',
                )}
              >
                <item.icon
                  className={cn(
                    'transition-all duration-150',
                    active ? 'h-5 w-5 text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'h-5 w-5 text-white/50',
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>

              <span
                className={cn(
                  'text-[10px] font-black tracking-wider uppercase transition-all duration-150',
                  active ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-white/40',
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
        </div>
      </nav>
    </div>
  );
});
