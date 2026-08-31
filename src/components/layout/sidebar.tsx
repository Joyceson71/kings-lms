'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, FileText, Settings,
  LogOut, CheckCircle, GraduationCap,
  ClipboardList, ShieldCheck, BarChart2, Library, Trophy,
  Calendar as CalendarIcon, Bell, ChevronRight, MessageSquare, Sparkles, MapPin, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/lib/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useState, useCallback, memo, useEffect } from 'react';
import { useSidebar } from '@/components/layout/sidebar-provider';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType<any>;
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
      { name: 'IV Tracker',    href: '/dashboard/iv-tracker',    icon: MapPin },
      { name: 'Global Chat',   href: '/dashboard/chat',          icon: MessageSquare },
      { name: 'Announcements', href: '/dashboard/announcements',  icon: Bell },
      { name: 'Calendar',      href: '/dashboard/calendar',       icon: CalendarIcon },
    ],
  },
  {
    label: 'ACADEMICS',
    items: [
      { name: 'Attendance',    href: '/dashboard/attendance',    icon: CheckCircle },
      { name: 'Internal Marks',href: '/dashboard/internal-marks',icon: FileText },
      { name: 'Timetable',     href: '/dashboard/timetable',     icon: CalendarIcon },
      { name: 'Courses',       href: '/dashboard/courses',       icon: BookOpen },
      { name: 'Assignments',   href: '/dashboard/assignments',   icon: ClipboardList },
      { name: 'Resources',     href: '/dashboard/resources',     icon: Library },
      { name: 'IBM Bob',       href: '/dashboard/assistant',     icon: Sparkles },
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

const roleColors: Record<string, { bg: string; text: string; border: string; badgeClass: string }> = {
  student: { bg: 'rgb(0 245 255 / 0.1)',   text: '#00F5FF', border: 'rgb(0 245 255 / 0.3)',  badgeClass: 'anime-badge-cyan' },
  faculty: { bg: 'rgb(57 255 20 / 0.1)',   text: '#39FF14', border: 'rgb(57 255 20 / 0.3)',  badgeClass: 'anime-badge-volt' },
  admin:   { bg: 'rgb(255 215 0 / 0.12)',  text: '#FFD700', border: 'rgb(255 215 0 / 0.3)',  badgeClass: 'anime-badge-gold' },
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
        'group relative flex items-center rounded-xl text-[13px] font-bold transition-all duration-300 ease-out',
        expanded ? 'gap-3 px-3 h-10 mx-2' : 'justify-center h-10 w-10 mx-auto',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      <item.icon
        // @ts-expect-error dynamic component type mismatch
        className={cn(
          'flex-shrink-0 transition-all duration-300 ease-out',
          expanded ? 'h-[18px] w-[18px]' : 'h-[18px] w-[18px]',
          active
            ? 'text-primary-foreground drop-shadow-md'
            : 'text-muted-foreground group-hover:text-foreground',
        )}
      />

      {expanded && (
        <span className="flex-1 truncate animate-fade-in" style={{ animationDuration: '300ms' }}>{item.name}</span>
      )}

      {expanded && isAdmin && (
        <span className="anime-badge anime-badge-gold text-[9px] px-2 py-0.5 animate-fade-in rounded-full">
          ADMIN
        </span>
      )}

      {/* Tooltip for icon-only state */}
      {!expanded && (
        <span
          className="pointer-events-none absolute left-[calc(100%+14px)] rounded-xl px-3 py-2 text-xs font-bold text-popover-foreground opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-[200] bg-popover shadow-sm border"
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
  const [hasActiveIV, setHasActiveIV] = useState(false);
  const { displayName, loading, role } = useUser();
  const { isOpen, setIsOpen } = useSidebar();

  useEffect(() => {
    const checkActiveIV = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('iv_trips').select('id').eq('active', true).limit(1);
      if (data && data.length > 0) setHasActiveIV(true);
    };
    checkActiveIV();
  }, []);

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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[990] bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col flex-shrink-0 relative overflow-visible z-[1000] bg-card',
          'transition-all duration-300 ease-out',
          // Mobile specific classes
          'fixed inset-y-0 left-0 h-full w-64 md:static md:my-4 md:ml-4 md:h-[calc(100vh-2rem)] md:rounded-[1.75rem]',
          // Visibility based on state
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          expanded ? 'md:w-[260px]' : 'md:w-20',
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-white/5',
            (expanded || isOpen) ? 'md:gap-3 md:justify-start' : 'md:justify-center md:px-0',
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0" onClick={() => setIsOpen(false)}>
            <div
              className="h-9 w-9 flex-shrink-0 rounded-xl flex items-center justify-center bg-primary shadow-sm"
            >
              <GraduationCap className="h-5 w-5 text-primary-foreground drop-shadow-md" />
            </div>
            <span
              className={cn(
                "text-[15px] font-black tracking-tighter text-foreground truncate animate-fade-in brutalist-heading",
                !expanded && !isOpen ? "md:hidden" : ""
              )}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              KINGS EC
            </span>
          </Link>
          {/* Mobile close button */}
          {isOpen && (
            <button
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

      {/* Expand indicator */}
      <div
        className={cn(
          'absolute -right-3 top-[60px] z-20 h-6 w-6 rounded-full items-center justify-center bg-card shadow-sm border border-white/10',
          'text-muted-foreground transition-all duration-300 ease-out hover:text-foreground cursor-pointer',
          expanded ? 'flex opacity-100' : 'hidden opacity-0',
        )}
      >
        <ChevronRight className="h-3 w-3" />
      </div>

        {/* Nav */}
        <nav className={cn('flex flex-1 flex-col overflow-y-auto overflow-x-hidden py-4 gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', expanded ? 'px-2' : 'px-1')}>
          {navSections.map((section) => {
            const visible = section.items.filter(i => !i.roles || i.roles.includes(role));
            if (visible.length === 0) return null;

            return (
              <div key={section.label} className="mb-4">
                {expanded ? (
                  <p className="px-4 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/70">
                    {section.label}
                  </p>
                ) : (
                  <div className="my-3 mx-auto h-[3px] w-6 rounded-full bg-secondary" />
                )}

                <div className="flex flex-col gap-0.5">
                {visible.map((item) => {
                  const active = isActive(item.href);
                  const isAdmin = item.roles?.length === 1 && item.roles[0] === 'admin';
                  const showBadge = item.name === 'IV Tracker' && hasActiveIV;
                  return (
                    <div key={item.name + item.href} className="relative">
                      <NavLink
                        item={item}
                        active={active}
                        isAdmin={isAdmin}
                        expanded={expanded || isOpen}
                      />
                      {showBadge && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex-1" />

        {/* Bottom nav items */}
        <div className="my-2 mx-4 h-[2px] rounded-full bg-secondary" />

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
                  'group relative flex items-center rounded-xl text-[13px] font-bold transition-all duration-300 ease-out mb-1',
                  expanded ? 'gap-3 px-3 h-10 mx-2' : 'justify-center h-10 w-10 mx-auto',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                {/* @ts-expect-error dynamic component type mismatch */}
                <item.icon className={cn('flex-shrink-0 transition-all duration-300 ease-out', expanded ? 'h-[18px] w-[18px]' : 'h-[18px] w-[18px]', active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                {expanded && <span className="animate-fade-in" style={{ animationDuration: '400ms' }}>{item.name}</span>}
                {!expanded && (
                  <span className="pointer-events-none absolute left-[calc(100%+14px)] rounded-xl px-3 py-2 text-xs font-bold text-popover-foreground opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-[200] bg-popover shadow-sm border">
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
            'group relative flex items-center rounded-xl text-[13px] font-bold transition-all duration-300 ease-out w-full',
            'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            expanded ? 'gap-3 px-3 h-10 mx-2 mb-2' : 'justify-center h-10 w-10 mx-auto mb-2',
          )}
        >
          <LogOut className={cn('flex-shrink-0 text-muted-foreground group-hover:text-destructive transition-all duration-300 ease-out', expanded ? 'h-[18px] w-[18px]' : 'h-[18px] w-[18px]')} />
          {expanded && <span className="animate-fade-in" style={{ animationDuration: '400ms' }}>Logout</span>}
          {!expanded && (
            <span className="pointer-events-none absolute left-[calc(100%+14px)] rounded-xl px-3 py-2 text-xs font-bold text-popover-foreground opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-[200] bg-popover shadow-sm border">
              Logout
            </span>
          )}
        </button>
      </nav>

        {/* User footer */}
        <div
          className={cn(
            'flex-shrink-0 py-4 border-t border-white/5 transition-all duration-300',
            (expanded || isOpen) ? 'px-4' : 'px-0 flex justify-center'
          )}
        >
          {loading ? (
            <div className={cn('flex items-center', (expanded || isOpen) ? 'gap-3' : 'justify-center')}>
              <div className="h-9 w-9 rounded-full bg-secondary flex-shrink-0" />
              {(expanded || isOpen) && (
                <div className="flex-1 space-y-2 animate-fade-in" style={{ animationDuration: '400ms' }}>
                  <div className="h-2.5 w-20 rounded bg-secondary" />
                  <div className="h-2 w-12 rounded bg-secondary" />
                </div>
              )}
            </div>
          ) : (
            <div className={cn('flex items-center', (expanded || isOpen) ? 'gap-3' : 'justify-center')}>
              <Avatar name={displayName} size="sm" ring="none" />
              {(expanded || isOpen) && (
                <div className="flex-1 min-w-0 animate-fade-in" style={{ animationDuration: '400ms' }}>
                  <p className="text-[13px] font-bold text-foreground truncate">{displayName}</p>
                  <span className={cn('anime-badge mt-1 inline-block capitalize', roleStyle.badgeClass)}>
                    {role}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
