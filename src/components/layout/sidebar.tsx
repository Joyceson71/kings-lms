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
  { name: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard },
  { name: 'Announcements',href: '/dashboard/announcements', icon: Bell },
  { name: 'Attendance',   href: '/dashboard/attendance',   icon: CheckCircle },
  { name: 'Courses',      href: '/dashboard/courses',      icon: BookOpen },
  { name: 'Assignments',  href: '/dashboard/assignments',  icon: ClipboardList },
  { name: 'Resources',    href: '/dashboard/resources',    icon: Library },
  { name: 'Leaderboard',  href: '/dashboard/leaderboard',  icon: Trophy,    roles: ['student'] },
  { name: 'Calendar',     href: '/dashboard/calendar',     icon: CalendarIcon },
  { name: 'Students',     href: '/dashboard/students',     icon: Users,     roles: ['faculty', 'admin'] },
  { name: 'Admin Panel',  href: '/dashboard/admin',        icon: ShieldCheck, roles: ['admin'] },
  { name: 'Settings',     href: '/dashboard/settings',     icon: Settings },
];

const bottomNavigation: NavItem[] = [
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart2, roles: ['faculty', 'admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText,  roles: ['student'] },
];

const roleBadgeVariant = {
  student: 'student' as const,
  faculty: 'faculty' as const,
  admin:   'admin'   as const,
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

  const visibleNav    = navigation.filter((i) => !i.roles || i.roles.includes(role));
  const visibleBottom = bottomNavigation.filter((i) => !i.roles || i.roles.includes(role));
  const showLabel = !collapsed || isOpen;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col transition-all duration-300 ease-in-out md:relative flex-shrink-0',
          collapsed ? 'md:w-[64px] w-64' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{
          background: 'oklch(0.055 0.012 255)',
          borderRight: '1px solid oklch(1 0 0 / 0.055)',
        }}
      >
        {/* Cyan shimmer line at top */}
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(0.72 0.19 195 / 0.6), transparent)' }}
        />

        {/* Brand */}
        <div
          className={cn(
            'flex h-[60px] shrink-0 items-center px-4 border-b',
            collapsed ? 'md:justify-center' : 'gap-3',
          )}
          style={{ borderColor: 'oklch(1 0 0 / 0.055)' }}
        >
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <div
              className="h-8 w-8 flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, oklch(0.72 0.19 195), oklch(0.58 0.20 210))',
                boxShadow: '0 0 18px oklch(0.72 0.19 195 / 0.45)',
              }}
            >
              <GraduationCap className="h-4.5 w-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />
            </div>
            {showLabel && (
              <span
                className="text-[15px] font-bold tracking-tight text-white/90 truncate"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Kings EC
              </span>
            )}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-[68px] z-20 h-6 w-6 items-center justify-center rounded-full border text-white/40 hover:text-white/80 transition-all duration-200"
          style={{
            background: 'oklch(0.13 0.018 255)',
            borderColor: 'oklch(1 0 0 / 0.1)',
            boxShadow: '0 2px 8px oklch(0 0 0 / 0.4)',
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-3 gap-0.5">
          {showLabel && (
            <p className="px-2.5 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
              Navigation
            </p>
          )}

          {visibleNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const isAdmin  = item.roles?.length === 1 && item.roles[0] === 'admin';

            const activeStyles = isAdmin
              ? {
                  background: 'oklch(0.76 0.15 80 / 0.1)',
                  boxShadow: 'inset 0 0 0 1px oklch(0.80 0.15 80 / 0.2)',
                }
              : {
                  background: 'oklch(0.72 0.19 195 / 0.12)',
                  boxShadow: 'inset 0 0 0 1px oklch(0.72 0.19 195 / 0.22)',
                };

            return (
              <Link
                key={item.name + item.href}
                href={item.href}
                title={collapsed && !isOpen ? item.name : undefined}
                className={cn(
                  'group relative flex items-center rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                  collapsed && !isOpen ? 'justify-center' : 'gap-2.5',
                  !isActive && 'text-white/45 hover:text-white/80',
                  isActive && (isAdmin ? 'text-amber-300' : 'text-cyan-300'),
                )}
                style={isActive ? activeStyles : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'oklch(1 0 0 / 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = '';
                  }
                }}
              >
                {/* Active bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                    style={{
                      background: isAdmin ? 'oklch(0.80 0.15 80)' : 'oklch(0.72 0.19 195)',
                      boxShadow: isAdmin
                        ? '0 0 6px oklch(0.80 0.15 80 / 0.9)'
                        : '0 0 6px oklch(0.72 0.19 195 / 0.9)',
                    }}
                  />
                )}

                <item.icon
                  className="h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150"
                  style={{
                    color: isActive
                      ? isAdmin ? 'oklch(0.80 0.15 80)' : 'oklch(0.72 0.19 195)'
                      : undefined,
                    filter: isActive
                      ? isAdmin
                        ? 'drop-shadow(0 0 5px oklch(0.80 0.15 80 / 0.7))'
                        : 'drop-shadow(0 0 5px oklch(0.72 0.19 195 / 0.7))'
                      : undefined,
                  }}
                />

                {showLabel && <span className="flex-1 truncate">{item.name}</span>}

                {showLabel && isAdmin && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'oklch(0.80 0.15 80 / 0.15)',
                      color: 'oklch(0.80 0.15 80)',
                      border: '1px solid oklch(0.80 0.15 80 / 0.3)',
                    }}
                  >
                    ADMIN
                  </span>
                )}

                {/* Tooltip */}
                {collapsed && !isOpen && (
                  <div
                    className="pointer-events-none hidden md:block absolute left-full ml-2.5 px-2.5 py-1.5 text-white/85 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                    style={{
                      background: 'oklch(0.13 0.018 255)',
                      border: '1px solid oklch(1 0 0 / 0.08)',
                      boxShadow: '0 4px 16px oklch(0 0 0 / 0.5)',
                    }}
                  >
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}

          <div className="flex-1" />

          {/* Divider */}
          <div className="my-2" style={{ borderTop: '1px solid oklch(1 0 0 / 0.07)' }} />

          {/* Bottom nav */}
          {visibleBottom.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name + item.href}
                href={item.href}
                title={collapsed && !isOpen ? item.name : undefined}
                className={cn(
                  'group relative flex items-center rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                  collapsed && !isOpen ? 'justify-center' : 'gap-2.5',
                  isActive ? 'text-cyan-300' : 'text-white/40 hover:text-white/75',
                )}
                style={isActive ? { background: 'oklch(0.72 0.19 195 / 0.1)', boxShadow: 'inset 0 0 0 1px oklch(0.72 0.19 195 / 0.2)' } : undefined}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'oklch(1 0 0 / 0.05)'; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
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
              'group flex items-center rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/35 transition-all duration-150',
              collapsed && !isOpen ? 'justify-center' : 'gap-2.5 w-full',
            )}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.60 0.22 20 / 0.12)';
              (e.currentTarget as HTMLElement).style.color = 'oklch(0.70 0.22 20)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '';
              (e.currentTarget as HTMLElement).style.color = '';
            }}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150" />
            {showLabel && 'Logout'}
          </button>
        </nav>

        {/* User card */}
        {showLabel && (
          <div
            className="flex-shrink-0 p-3"
            style={{ borderTop: '1px solid oklch(1 0 0 / 0.07)' }}
          >
            {loading ? (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full animate-pulse" style={{ background: 'oklch(0.15 0.02 255)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-24 rounded-full animate-pulse" style={{ background: 'oklch(0.15 0.02 255)' }} />
                  <div className="h-2 w-14 rounded-full animate-pulse" style={{ background: 'oklch(0.15 0.02 255)' }} />
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-2.5 rounded-xl p-2"
                style={{ background: 'oklch(1 0 0 / 0.04)', border: '1px solid oklch(1 0 0 / 0.06)' }}
              >
                <Avatar name={displayName} size="sm" ring="violet" glow />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white/85 truncate">{displayName}</p>
                  <Badge variant={roleBadgeVariant[role]} className="mt-0.5 px-1.5 py-0 text-[10px] h-4">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                </div>
                <Link href="/dashboard/settings" className="text-white/25 hover:text-white/60 transition-colors p-1" aria-label="Settings">
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
