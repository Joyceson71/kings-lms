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
        'group relative flex items-center rounded-lg text-[13px] font-semibold transition-all duration-300 ease-out',
        expanded ? 'gap-3 px-3 h-10' : 'justify-center h-10 w-10 mx-auto',
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
      style={active ? {
        background: isAdmin
          ? 'rgb(255 215 0 / 0.08)'
          : 'rgb(255 0 110 / 0.1)',
        boxShadow: isAdmin
          ? '4px 4px 0 rgb(255 215 0 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.05)'
          : '4px 4px 0 rgb(255 0 110 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.05)',
        borderLeft: isAdmin ? '2px solid #FFD700' : '2px solid #FF006E',
      } : {
        transition: 'all 0.2s ease',
      }}
    >
      {/* Active left-stripe indicator — brutalist */}
      {active && !expanded && (
        <span
          className="absolute inset-0 rounded-lg"
          style={{
            background: isAdmin
              ? 'rgb(255 215 0 / 0.1)'
              : 'rgb(255 0 110 / 0.1)',
            boxShadow: isAdmin
              ? '0 0 12px rgb(255 215 0 / 0.3)'
              : '0 0 12px rgb(255 0 110 / 0.3)',
          }}
        />
      )}

      <item.icon
        // @ts-expect-error dynamic component type mismatch
        className={cn(
          'flex-shrink-0 transition-all duration-300 ease-out',
          expanded ? 'h-4 w-4' : 'h-[18px] w-[18px]',
          active
            ? isAdmin ? 'text-yellow-300 drop-shadow-[0_0_8px_#FFD700]' : 'text-pink-400 drop-shadow-[0_0_8px_#FF006E]'
            : 'text-muted-foreground group-hover:text-foreground',
        )}
      />

      {expanded && (
        <span className="flex-1 truncate animate-fade-in" style={{ animationDuration: '300ms' }}>{item.name}</span>
      )}

      {expanded && isAdmin && (
        <span className="anime-badge anime-badge-gold text-[8px] px-1.5 py-0.5 animate-fade-in">
          ADMIN
        </span>
      )}

      {/* Tooltip for icon-only state */}
      {!expanded && (
        <span
          className="pointer-events-none absolute left-[calc(100%+10px)] rounded-md px-2.5 py-1.5 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200] animate-slide-in-right"
          style={{
            background: '#0D0D1E',
            border: '1px solid #252545',
            boxShadow: '4px 4px 0 rgb(255 0 110 / 0.2)',
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
          'flex flex-col flex-shrink-0 relative overflow-visible z-[1000]',
          'transition-all duration-300 ease-out',
          // Mobile specific classes
          'fixed inset-y-0 left-0 h-full w-64 md:static md:my-3 md:ml-3 md:h-[calc(100vh-1.5rem)] md:rounded-2xl',
          // Visibility based on state
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          expanded ? 'md:w-64' : 'md:w-20',
        )}
        style={{
          background: '#0D0D1E',
          border: '1px solid #252545',
          boxShadow:
            '8px 8px 20px #06060F, -4px -4px 12px #1E1E38, inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Anime energy bar at top of sidebar */}
        <div className="energy-bar-thin" />
        {/* Brand */}
        <div
          className={cn(
            'flex h-14 flex-shrink-0 items-center justify-between px-4',
            (expanded || isOpen) ? 'md:gap-3 md:justify-start' : 'md:justify-center md:px-0',
          )}
          style={{ borderBottom: '1px solid #252545' }}
        >
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0" onClick={() => setIsOpen(false)}>
            <div
              className="h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center glitch-text"
              style={{
                background: 'linear-gradient(135deg, #FF006E 0%, #BF00FF 100%)',
                boxShadow: '0 0 16px rgb(255 0 110 / 0.5), 4px 4px 0 rgb(255 0 110 / 0.2)',
              }}
            >
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span
              className={cn(
                "text-[14px] font-black tracking-tighter text-foreground truncate animate-fade-in brutalist-heading",
                !expanded && !isOpen ? "md:hidden" : ""
              )}
              style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px' }}
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
          'absolute -right-3 top-[52px] z-20 h-5 w-5 rounded-full items-center justify-center',
          'border text-muted-foreground transition-all duration-300 ease-out',
          expanded ? 'flex opacity-100' : 'hidden opacity-0',
        )}
        style={{ background: '#0c0c20', borderColor: '#1a1a3a' }}
      >
        <ChevronRight className="h-2.5 w-2.5" />
      </div>

        {/* Nav */}
        <nav className={cn('flex flex-1 flex-col overflow-y-auto overflow-x-hidden py-3 gap-px [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', expanded ? 'px-2' : 'px-1.5')}>
          {navSections.map((section) => {
            const visible = section.items.filter(i => !i.roles || i.roles.includes(role));
            if (visible.length === 0) return null;

            return (
              <div key={section.label} className="mb-4">
                {expanded ? (
                  <p className="px-3 mb-1.5 text-[9px] font-black tracking-[0.2em] uppercase animate-brutalist-slide brutalist-stripe"
                    style={{ color: '#FF006E', paddingLeft: '12px' }}>
                    {section.label}
                  </p>
                ) : (
                  <div className="my-1.5 mx-1.5 divider-pink" />
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
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-muted-foreground',
                )}
                style={active ? {
                  background: 'rgb(129 140 248 / 0.1)',
                  boxShadow: '0 0 0 1px rgb(129 140 248 / 0.2)',
                } : {}}
              >
                {/* @ts-expect-error dynamic component type mismatch */}
        <item.icon className={cn('flex-shrink-0 transition-all duration-300 ease-out', expanded ? 'h-4 w-4' : 'h-[18px] w-[18px]', active ? 'text-indigo-300' : 'text-muted-foreground group-hover:text-muted-foreground')} />
                {expanded && <span className="animate-fade-in" style={{ animationDuration: '400ms' }}>{item.name}</span>}
                {!expanded && (
                  <span className="pointer-events-none absolute left-[calc(100%+8px)] rounded-lg px-2.5 py-1.5 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200]"
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
            'text-muted-foreground hover:text-red-300 hover:bg-red-500/5',
            expanded ? 'gap-3 px-3 h-9' : 'justify-center h-10 w-10 mx-auto',
          )}
        >
          <LogOut className={cn('flex-shrink-0 text-muted-foreground group-hover:text-red-400 transition-all duration-300 ease-out', expanded ? 'h-4 w-4' : 'h-[18px] w-[18px]')} />
          {expanded && <span className="animate-fade-in" style={{ animationDuration: '400ms' }}>Logout</span>}
          {!expanded && (
            <span className="pointer-events-none absolute left-[calc(100%+8px)] rounded-lg px-2.5 py-1.5 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200]"
              style={{ background: '#0c0c20', border: '1px solid #1a1a3a', boxShadow: '0 4px 16px rgb(0 0 0 / 0.6)' }}>
              Logout
            </span>
          )}
        </button>
      </nav>

        {/* User footer */}
        <div
          className="flex-shrink-0 py-3"
          style={{
            borderTop: '1px solid #252545',
            padding: (expanded || isOpen) ? '12px 16px' : '12px 0',
            display: 'flex',
            justifyContent: (expanded || isOpen) ? 'flex-start' : 'center',
          }}
        >
          {loading ? (
            <div className={cn('flex items-center', (expanded || isOpen) ? 'gap-2.5' : 'justify-center')}>
              <div className="h-8 w-8 rounded-full skeleton flex-shrink-0" />
              {(expanded || isOpen) && (
                <div className="flex-1 space-y-1.5 animate-fade-in" style={{ animationDuration: '400ms' }}>
                  <div className="h-2 w-20 rounded skeleton" />
                  <div className="h-2 w-12 rounded skeleton" />
                </div>
              )}
            </div>
          ) : (
            <div className={cn('flex items-center', (expanded || isOpen) ? 'gap-2.5' : 'justify-center')}>
              <Avatar name={displayName} size="sm" ring="none" />
              {(expanded || isOpen) && (
                <div className="flex-1 min-w-0 animate-fade-in" style={{ animationDuration: '400ms' }}>
                  <p className="text-[12px] font-bold text-foreground/90 truncate">{displayName}</p>
                  <span className={cn('anime-badge mt-0.5 inline-block capitalize', roleStyle.badgeClass)}>
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
