'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CheckCircle, BookOpen, Settings, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import { motion } from 'framer-motion';

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
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden flex justify-center pointer-events-none" style={{ perspective: 800 }}>
      <motion.nav
        initial={{ y: 100, rotateX: -20, opacity: 0 }}
        animate={{ y: 0, rotateX: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex items-stretch pointer-events-auto px-2 relative rounded-xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transformStyle: "preserve-3d",
          background: '#0D0D1E',
          border: '2px solid #252545',
          boxShadow: '8px 8px 0 rgb(255 0 110 / 0.15), 0 20px 50px rgb(0 0 0 / 0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Anime energy bar at top of dock */}
        <div className="absolute top-0 left-0 right-0 energy-bar-thin rounded-t-xl" />

        <div className="flex items-stretch w-full max-w-md mx-auto py-1">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 outline-none"
            >
              {/* Active Background — Brutalist style */}
              {active && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-y-1.5 inset-x-1 rounded-lg"
                  style={{
                    background: 'rgb(255 0 110 / 0.1)',
                    border: '1px solid rgb(255 0 110 / 0.3)',
                    boxShadow: '0 0 12px rgb(255 0 110 / 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}

              {/* Icon Container */}
              <motion.div
                whileHover={{ y: -4, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'relative z-10 flex items-center justify-center rounded-md transition-colors duration-300',
                  active ? 'w-10 h-8 text-foreground' : 'w-8 h-8 text-muted-foreground hover:text-foreground',
                )}
              >
                <item.icon
                  className={cn(
                    'transition-all duration-300',
                    active
                      ? 'h-5 w-5 text-primary drop-shadow-[0_0_8px_#FF006E]'
                      : 'h-5 w-5',
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
              </motion.div>

              <span
                className={cn(
                  'relative z-10 text-[9px] font-black tracking-widest uppercase transition-all duration-300',
                  active ? 'text-primary' : 'text-muted-foreground opacity-70',
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
        </div>
      </motion.nav>
    </div>
  );
});
