'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, FileText, Settings,
  LogOut, CheckCircle, GraduationCap, ChevronLeft, ChevronRight,
  ClipboardList, ShieldCheck, BarChart2, Library, Trophy, Calendar as CalendarIcon, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
  { name: 'Attendance', href: '/dashboard/attendance', icon: CheckCircle },
  { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
  { name: 'Assignments', href: '/dashboard/assignments', icon: ClipboardList },
  { name: 'Resources', href: '/dashboard/resources', icon: Library },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy, roles: ['student'] },
  { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarIcon },
  // Faculty + Admin only
  { name: 'Students', href: '/dashboard/students', icon: Users, roles: ['faculty', 'admin'] },
  // Admin only
  { name: 'Admin Panel', href: '/dashboard/admin', icon: ShieldCheck, roles: ['admin'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const bottomNavigation: NavItem[] = [
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart2, roles: ['faculty', 'admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['student'] },
];

const roleBadgeVariant = {
  student: 'student' as const,
  faculty: 'faculty' as const,
  admin: 'admin' as const,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, loading, displayName, role } = useUser();
  const { isOpen, setIsOpen } = useSidebar();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Filter nav items based on role
  const visibleNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(role)
  );
  const visibleBottom = bottomNavigation.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col transition-all duration-300 ease-in-out border-r md:relative flex-shrink-0',
          'border-sidebar-border',
          collapsed ? 'md:w-[68px] w-64' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{
          background: 'oklch(0.065 0.015 265)',
          boxShadow: 'inset -1px 0 0 oklch(1 0 0 / 0.05)',
        }}
      >
        {/* Top gradient shimmer */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Logo/Brand */}
        <div className={cn('flex h-16 shrink-0 items-center px-4 border-b border-sidebar-border', collapsed ? 'md:justify-center' : 'gap-3')}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-[0_0_20px_oklch(0.65_0.26_285/0.4)]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            {(!collapsed || isOpen) && (
              <span className={cn(
                'text-lg font-black tracking-tight text-sidebar-foreground',
                collapsed && !isOpen ? 'hidden' : 'block md:block',
                collapsed && isOpen ? 'block' : ''
              )} style={{ fontFamily: 'Outfit, sans-serif' }}>
                Kings EC
              </span>
            )}
          </Link>
        </div>

        {/* Collapse toggle (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-[72px] z-20 h-6 w-6 items-center justify-center rounded-full bg-secondary border border-border shadow-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4 gap-1">
          {(!collapsed || isOpen) && (
            <p className={cn(
              'px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50',
              collapsed && !isOpen ? 'hidden' : 'block'
            )}>
              Navigation
            </p>
          )}

          {visibleNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const isAdmin = item.roles?.length === 1 && item.roles[0] === 'admin';
            const showLabel = !collapsed || isOpen;

            return (
              <Link
                key={item.name + item.href}
                href={item.href}
                title={collapsed && !isOpen ? item.name : undefined}
                className={cn(
                  'group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && !isOpen ? 'justify-center' : 'gap-3',
                  isActive
                    ? isAdmin
                      ? 'bg-amber-500/15 text-amber-400 shadow-[inset_0_0_0_1px_oklch(0.75_0.16_85/0.25)]'
                      : 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.65_0.26_285/0.25)]'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full',
                    isAdmin
                      ? 'bg-amber-400 shadow-[0_0_8px_oklch(0.75_0.16_85/0.8)]'
                      : 'bg-primary shadow-[0_0_8px_oklch(0.65_0.26_285/0.8)]'
                  )} />
                )}

                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-all duration-200',
                    isActive
                      ? isAdmin
                        ? 'text-amber-400 drop-shadow-[0_0_6px_oklch(0.75_0.16_85/0.8)]'
                        : 'text-primary drop-shadow-[0_0_6px_oklch(0.65_0.26_285/0.8)]'
                      : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/80'
                  )}
                />
                {showLabel && (
                  <span className="flex-1">{item.name}</span>
                )}

                {/* Admin badge chip */}
                {showLabel && isAdmin && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    ADMIN
                  </span>
                )}

                {/* Tooltip for collapsed */}
                {collapsed && !isOpen && (
                  <div className="pointer-events-none hidden md:block absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border text-foreground text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Divider */}
          <div className="my-2 border-t border-sidebar-border/50" />

          {/* Bottom nav items */}
          {visibleBottom.map((item) => {
            const isActive = pathname === item.href;
            const showLabel = !collapsed || isOpen;
            return (
              <Link
                key={item.name + item.href}
                href={item.href}
                title={collapsed && !isOpen ? item.name : undefined}
                className={cn(
                  'group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && !isOpen ? 'justify-center' : 'gap-3',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary' : 'text-sidebar-foreground/35 group-hover:text-sidebar-foreground/70')} />
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
              'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 hover:bg-red-950/30 hover:text-red-400 transition-all duration-200',
              collapsed && !isOpen ? 'justify-center' : 'gap-3 w-full'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-sidebar-foreground/35 group-hover:text-red-400 transition-colors" />
            {(!collapsed || isOpen) && 'Logout'}
          </button>
        </nav>

        {/* User profile bottom */}
        {(!collapsed || isOpen) && (
          <div className={cn(
            'flex-shrink-0 border-t border-sidebar-border/50 p-4',
            collapsed && !isOpen ? 'hidden' : 'block'
          )}>
            {loading ? (
              // Skeleton
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded-full bg-secondary animate-pulse" />
                  <div className="h-2.5 w-16 rounded-full bg-secondary animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar name={displayName} size="sm" ring="violet" glow />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">{displayName}</p>
                  <Badge variant={roleBadgeVariant[role]} className="mt-0.5 px-1.5 py-0 text-[10px]">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                </div>
                <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
