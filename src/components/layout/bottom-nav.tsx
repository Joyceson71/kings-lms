'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CheckCircle, BookOpen, ClipboardList, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

const mobileNavItems = [
  { name: 'Home',        href: '/dashboard',             icon: LayoutDashboard },
  { name: 'Attendance',  href: '/dashboard/attendance',  icon: CheckCircle },
  { name: 'Courses',     href: '/dashboard/courses',     icon: BookOpen },
  { name: 'Assignments', href: '/dashboard/assignments', icon: ClipboardList },
  { name: 'Settings',    href: '/dashboard/settings',    icon: Settings },
];

export const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(4, 4, 14, 0.95)',
        borderTop: '1px solid #1a1a3a',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        boxShadow: '0 -4px 24px rgb(0 0 0 / 0.5)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors duration-150',
                active ? 'text-indigo-300' : 'text-slate-600',
              )}
            >
              {/* Neon top indicator */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b-full"
                  style={{
                    background: 'linear-gradient(90deg, #818cf8, #22d3ee)',
                    boxShadow: '0 0 8px #818cf8, 0 0 16px rgb(129 140 248 / 0.4)',
                  }}
                />
              )}

              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl transition-all duration-150',
                  active ? 'w-9 h-7' : 'w-7 h-7',
                )}
                style={active ? {
                  background: 'rgb(129 140 248 / 0.12)',
                  boxShadow: '0 0 0 1px rgb(129 140 248 / 0.2)',
                } : {}}
              >
                <item.icon
                  className={cn(
                    'transition-all duration-150',
                    active ? 'h-4 w-4' : 'h-4 w-4',
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-semibold transition-all duration-150',
                  active ? 'text-indigo-300' : 'text-slate-600',
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
