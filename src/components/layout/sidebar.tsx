'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, FileText, Settings,
  LogOut, CheckCircle, GraduationCap,
  ClipboardList, ShieldCheck, BarChart2, Library, Trophy,
  Calendar as CalendarIcon, Bell, ChevronRight, MessageSquare, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/lib/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useState, useCallback, memo } from 'react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: ('student' | 'faculty' | 'admin')[];
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: 'MAIN',
    items: [
      { name: 'Dashboard',     href: '/dashboard',               icon: LayoutDashboard },
      { name: 'Global Chat',   href: '/dashboard/chat',          icon: MessageSquare },
      { name: 'Announcements', href: '/dashboard/announcements',  icon: Bell },
      { name: 'Calendar',      href: '/dashboard/calendar',       icon: CalendarIcon },
    ],
  },
  {
    label: 'ACADEMICS',
    items: [
      { name: 'Attendance',    href: '/dashboard/attendance',    icon: CheckCircle },
      { name: 'Courses',       href: '/dashboard/courses',       icon: BookOpen },
      { name: 'Assignments',   href: '/dashboard/assignments',   icon: ClipboardList },
      { name: 'Resources',     href: '/dashboard/resources',     icon: Library },
      { name: 'AI Assistant',  href: '/dashboard/assistant',     icon: Sparkles },
      { name: 'Leaderboard',   href: '/dashboard/leaderboard',   icon: Trophy,      roles: ['student'] },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { name: 'Students',      href: '/dashboard/students',      icon: Users,       roles: ['faculty', 'admin'] },
      { name: 'Admin Panel',   href: '/dashboard/admin',         icon: ShieldCheck, roles: ['admin'] },
      { name: 'Settings',      href: '/dashboard/settings',      icon: Settings },
    ],
  },
];

const bottomNavigation: NavItem[] = [
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart2, roles: ['faculty', 'admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText,  roles: ['student'] },
];

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  student: { bg: 'rgb(129 140 248 / 0.12)', text: '#a5b4fc', border: 'rgb(129 140 248 / 0.25)' },
  faculty: { bg: 'rgb(52 211 153 / 0.12)',  text: '#6ee7b7', border: 'rgb(52 211 153 / 0.25)' },
  admin:   { bg: 'rgb(251 191 36 / 0.12)',  text: '#fde68a', border: 'rgb(251 191 36 / 0.25)' },
};

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  isAdmin: boolean;
  expanded: boolean;
}

const NavLink = memo(function NavLink({ item, active, isAdmin, expanded }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      title={!expanded ? item.name : undefined}
      className={cn(
        'group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-300 ease-out',
        expanded ? 'gap-3 px-3 h-9' : 'justify-center h-10 w-10 mx-auto',
        active
          ? 'text-white'
          : 'text-slate-500 hover:text-slate-200',
      )}
      style={active ? {
        background: isAdmin
          ? 'rgb(251 191 36 / 0.1)'
          : 'rgb(129 140 248 / 0.12)',
        boxShadow: isAdmin
          ? '0 0 0 1px rgb(251 191 36 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.05)'
          : '0 0 0 1px rgb(129 140 248 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.05)',
      } : {}}
    >
      {/* Active pill indicator */}
      {active && expanded && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{
            background: isAdmin
              ? 'linear-gradient(180deg, #fbbf24, #f59e0b)'
              : 'linear-gradient(180deg, #818cf8, #22d3ee)',
            boxShadow: isAdmin ? '0 0 8px #fbbf24' : '0 0 8px #818cf8',
          }}
        />
      )}

      {active && !expanded && (
        <span
          className="absolute inset-0 rounded-xl"
          style={{
            background: isAdmin
              ? 'rgb(251 191 36 / 0.12)'
              : 'rgb(129 140 248 / 0.12)',
            boxShadow: isAdmin
              ? '0 0 0 1px rgb(251 191 36 / 0.2)'
              : '0 0 0 1px rgb(129 140 248 / 0.2)',
          }}
        />
      )}

      <item.icon
        className={cn(
          'flex-shrink-0 transition-all duration-300 ease-out',
          expanded ? 'h-4 w-4' : 'h-[18px] w-[18px]',
          active
            ? isAdmin ? 'text-amber-300' : 'text-indigo-300'
            : 'text-slate-600 group-hover:text-slate-300',
        )}
      />

      {expanded && (
        <span className="flex-1 truncate">{item.name}</span>
      )}

      {expanded && isAdmin && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wider"
          style={{ background: 'rgb(251 191 36 / 0.12)', color: '#fbbf24', border: '1px solid rgb(251 191 36 / 0.2)' }}
        >
          ADMIN
        </span>
      )}

      {/* Tooltip for icon-only state */}
      {!expanded && (
        <span
          className="pointer-events-none absolute left-[calc(100%+8px)] rounded-lg px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200]"
          style={{
            background: '#0c0c20',
            border: '1px solid #1a1a3a',
            boxShadow: '0 4px 16px rgb(0 0 0 / 0.6)',
          }}
        >
          {item.name}
        </span>
      )}
    </Link>
  );
});

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [expanded, setExpanded] = useState(false);
  const { displayName, loading, role } = useUser();

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  }, [router]);

  const isActive = useCallback((href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href)),
    [pathname]
  );

  const roleStyle = roleColors[role] ?? roleColors.student;

  return (
    /* Desktop-only sidebar — hidden on mobile (bottom nav handles it) */
    <aside
      className={cn(
        'hidden md:flex h-full flex-col flex-shrink-0 relative',
        'transition-all duration-300 ease-out',
        expanded ? 'w-56' : 'w-16',
      )}
      style={{
        background: 'linear-gradient(180deg, #020210 0%, #04040e 100%)',
        borderRight: '1px solid #1a1a3a',
        boxShadow: '4px 0 24px rgb(0 0 0 / 0.3)',
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex h-14 flex-shrink-0 items-center',
          expanded ? 'px-4 gap-3' : 'justify-center',
        )}
        style={{ borderBottom: '1px solid #1a1a3a' }}
      >
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div
            className="h-8 w-8 flex-shrink-0 rounded-xl flex items-center justify-center text-white"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              boxShadow: '0 0 16px rgb(129 140 248 / 0.4), 0 0 40px rgb(129 140 248 / 0.1)',
            }}
          >
            <GraduationCap className="h-4 w-4" />
          </div>
          {expanded && (
            <span
              className="text-[13px] font-bold tracking-tight text-white truncate"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Kings EC
            </span>
          )}
        </Link>
      </div>

      {/* Expand indicator */}
      <div
        className={cn(
          'absolute -right-3 top-[52px] z-20 h-5 w-5 rounded-full items-center justify-center',
          'border text-slate-500 transition-all duration-300 ease-out',
          expanded ? 'flex opacity-100' : 'hidden opacity-0',
        )}
        style={{ background: '#0c0c20', borderColor: '#1a1a3a' }}
      >
        <ChevronRight className="h-2.5 w-2.5" />
      </div>

      {/* Nav */}
      <nav className={cn('flex flex-1 flex-col overflow-y-auto overflow-x-hidden py-3 gap-px', expanded ? 'px-2' : 'px-1.5')}>
        {navSections.map((section) => {
          const visible = section.items.filter(i => !i.roles || i.roles.includes(role));
          if (visible.length === 0) return null;

          return (
            <div key={section.label} className="mb-3">
              {expanded && (
                <p className="px-3 mb-1.5 text-[9px] font-bold tracking-[0.15em] uppercase"
                  style={{ color: '#2d2d5e' }}>
                  {section.label}
                </p>
              )}
              {!expanded && (
                <div className="my-1.5 mx-1.5 h-px" style={{ background: 'linear-gradient(90deg, transparent, #1a1a3a, transparent)' }} />
              )}

              <div className="flex flex-col gap-0.5">
                {visible.map((item) => {
                  const active = isActive(item.href);
                  const isAdmin = item.roles?.length === 1 && item.roles[0] === 'admin';
                  return (
                    <NavLink
                      key={item.name + item.href}
                      item={item}
                      active={active}
                      isAdmin={isAdmin}
                      expanded={expanded}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex-1" />

        {/* Bottom nav items */}
        <div
          className="my-1.5 mx-1.5 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #1a1a3a, transparent)' }}
        />

        {bottomNavigation
          .filter(i => !i.roles || i.roles.includes(role))
          .map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name + item.href}
                href={item.href}
                title={!expanded ? item.name : undefined}
                className={cn(
                  'group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-300 ease-out',
                  expanded ? 'gap-3 px-3 h-9' : 'justify-center h-10 w-10 mx-auto',
                  active
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-200',
                )}
                style={active ? {
                  background: 'rgb(129 140 248 / 0.1)',
                  boxShadow: '0 0 0 1px rgb(129 140 248 / 0.2)',
                } : {}}
              >
                <item.icon className={cn('flex-shrink-0 transition-all duration-300 ease-out', expanded ? 'h-4 w-4' : 'h-[18px] w-[18px]', active ? 'text-indigo-300' : 'text-slate-600 group-hover:text-slate-300')} />
                {expanded && item.name}
                {!expanded && (
                  <span className="pointer-events-none absolute left-[calc(100%+8px)] rounded-lg px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200]"
                    style={{ background: '#0c0c20', border: '1px solid #1a1a3a', boxShadow: '0 4px 16px rgb(0 0 0 / 0.6)' }}>
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          id="sidebar-logout-btn"
          title={!expanded ? 'Logout' : undefined}
          className={cn(
            'group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-300 ease-out w-full',
            'text-slate-500 hover:text-red-300 hover:bg-red-500/5',
            expanded ? 'gap-3 px-3 h-9' : 'justify-center h-10 w-10 mx-auto',
          )}
        >
          <LogOut className={cn('flex-shrink-0 text-slate-600 group-hover:text-red-400 transition-all duration-300 ease-out', expanded ? 'h-4 w-4' : 'h-[18px] w-[18px]')} />
          {expanded && 'Logout'}
          {!expanded && (
            <span className="pointer-events-none absolute left-[calc(100%+8px)] rounded-lg px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200]"
              style={{ background: '#0c0c20', border: '1px solid #1a1a3a', boxShadow: '0 4px 16px rgb(0 0 0 / 0.6)' }}>
              Logout
            </span>
          )}
        </button>
      </nav>

      {/* User footer */}
      <div
        className="flex-shrink-0 py-3"
        style={{ borderTop: '1px solid #1a1a3a', padding: expanded ? '12px 16px' : '12px 0', display: 'flex', justifyContent: expanded ? 'flex-start' : 'center' }}
      >
        {loading ? (
          <div className={cn('flex items-center', expanded ? 'gap-2.5' : 'justify-center')}>
            <div className="h-8 w-8 rounded-full skeleton flex-shrink-0" />
            {expanded && (
              <div className="flex-1 space-y-1.5">
                <div className="h-2 w-20 rounded skeleton" />
                <div className="h-2 w-12 rounded skeleton" />
              </div>
            )}
          </div>
        ) : (
          <div className={cn('flex items-center', expanded ? 'gap-2.5' : 'justify-center')}>
            <Avatar name={displayName} size="sm" ring="none" />
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/90 truncate">{displayName}</p>
                <span
                  className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize tracking-wide"
                  style={roleStyle}
                >
                  {role}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
