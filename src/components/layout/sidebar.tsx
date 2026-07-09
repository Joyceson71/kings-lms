'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, FileText, Settings,
  LogOut, CheckCircle, GraduationCap, ChevronLeft, ChevronRight,
  ClipboardList, ShieldCheck, BarChart2, Library, Trophy,
  Calendar as CalendarIcon, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/lib/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useSidebar } from '@/components/layout/sidebar-provider';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: ('student' | 'faculty' | 'admin')[];
};

const navigation: NavItem[] = [
  { name: 'Dashboard',     href: '/dashboard',               icon: LayoutDashboard },
  { name: 'Announcements', href: '/dashboard/announcements',  icon: Bell },
  { name: 'Attendance',    href: '/dashboard/attendance',    icon: CheckCircle },
  { name: 'Courses',       href: '/dashboard/courses',       icon: BookOpen },
  { name: 'Assignments',   href: '/dashboard/assignments',   icon: ClipboardList },
  { name: 'Resources',     href: '/dashboard/resources',     icon: Library },
  { name: 'Leaderboard',   href: '/dashboard/leaderboard',   icon: Trophy,     roles: ['student'] },
  { name: 'Calendar',      href: '/dashboard/calendar',      icon: CalendarIcon },
  { name: 'Students',      href: '/dashboard/students',      icon: Users,      roles: ['faculty', 'admin'] },
  { name: 'Admin Panel',   href: '/dashboard/admin',         icon: ShieldCheck, roles: ['admin'] },
  { name: 'Settings',      href: '/dashboard/settings',      icon: Settings },
];

const bottomNavigation: NavItem[] = [
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart2, roles: ['faculty', 'admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText,  roles: ['student'] },
];

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { displayName, loading, role } = useUser();
  const { isOpen, setIsOpen } = useSidebar();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const visibleNav    = navigation.filter(i => !i.roles || i.roles.includes(role));
  const visibleBottom = bottomNavigation.filter(i => !i.roles || i.roles.includes(role));
  const showLabel     = !collapsed || isOpen;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col md:relative flex-shrink-0',
          'transition-[width] duration-200 ease-out',
          collapsed ? 'md:w-14 w-56' : 'w-56',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        style={{
          background: '#08080a',
          borderRight: '1px solid #1a1a1d',
        }}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex h-[52px] flex-shrink-0 items-center px-3',
            collapsed && !isOpen ? 'justify-center' : 'gap-2.5',
          )}
          style={{ borderBottom: '1px solid #1a1a1d' }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div
              className="h-7 w-7 flex-shrink-0 rounded-lg flex items-center justify-center text-white"
              style={{ background: '#6366f1' }}
            >
              <GraduationCap className="h-4 w-4" />
            </div>
            {showLabel && (
              <span className="text-[13px] font-semibold tracking-tight text-white truncate">
                Kings EC
              </span>
            )}
          </Link>
        </div>

        {/* Collapse button — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[60px] z-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 hover:text-white transition-colors"
          style={{ background: '#1a1a1d', border: '1px solid #2a2a2e' }}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3 gap-px">

          {visibleNav.map((item) => {
            const isActive = pathname === item.href
              || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const isAdmin  = item.roles?.length === 1 && item.roles[0] === 'admin';

            return (
              <Link
                key={item.name + item.href}
                href={item.href}
                title={collapsed && !isOpen ? item.name : undefined}
                className={cn(
                  'group relative flex items-center rounded-md text-[13px] font-medium transition-all duration-100',
                  collapsed && !isOpen ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8',
                  isActive
                    ? 'bg-[#1a1a1d] text-white'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#111113]',
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
                    style={{ background: isAdmin ? '#f59e0b' : '#6366f1' }}
                  />
                )}

                <item.icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive
                      ? isAdmin ? 'text-amber-400' : 'text-indigo-400'
                      : 'text-zinc-600 group-hover:text-zinc-400',
                  )}
                />

                {showLabel && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}

                {showLabel && isAdmin && (
                  <span
                    className="text-[9px] font-semibold px-1 py-px rounded"
                    style={{ background: 'rgb(245 158 11 / 0.12)', color: '#f59e0b', border: '1px solid rgb(245 158 11 / 0.2)' }}
                  >
                    ADMIN
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && !isOpen && (
                  <span
                    className="pointer-events-none absolute left-full ml-2.5 rounded-md px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                    style={{ background: '#1a1a1d', border: '1px solid #2a2a2e', boxShadow: '0 4px 12px rgb(0 0 0 / 0.5)' }}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="flex-1" />

          {/* Divider */}
          <div className="my-1" style={{ borderTop: '1px solid #1a1a1d' }} />

          {/* Bottom nav */}
          {visibleBottom.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name + item.href}
                href={item.href}
                title={collapsed && !isOpen ? item.name : undefined}
                className={cn(
                  'group flex items-center rounded-md text-[13px] font-medium transition-all duration-100',
                  collapsed && !isOpen ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8',
                  isActive ? 'bg-[#1a1a1d] text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#111113]',
                )}
              >
                <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
                {showLabel && item.name}
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed && !isOpen ? 'Logout' : undefined}
            id="sidebar-logout-btn"
            className={cn(
              'group flex items-center rounded-md text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-[#111113] transition-all duration-100 w-full',
              collapsed && !isOpen ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8',
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0 text-zinc-600 group-hover:text-red-400 transition-colors" />
            {showLabel && 'Logout'}
          </button>
        </nav>

        {/* User footer */}
        {showLabel && (
          <div
            className="flex-shrink-0 px-3 py-3"
            style={{ borderTop: '1px solid #1a1a1d' }}
          >
            {loading ? (
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full" style={{ background: '#1a1a1d' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2 w-20 rounded" style={{ background: '#1a1a1d' }} />
                  <div className="h-2 w-12 rounded" style={{ background: '#1a1a1d' }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Avatar name={displayName} size="sm" ring="none" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-white/90 truncate">{displayName}</p>
                  <p className="text-[11px] text-zinc-500 capitalize">{role}</p>
                </div>
                <Link href="/dashboard/settings" className="text-zinc-600 hover:text-zinc-300 transition-colors" aria-label="Settings">
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
