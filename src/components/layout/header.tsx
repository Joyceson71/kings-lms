'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, ChevronRight, Settings, LogOut, User, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useSidebar } from '@/components/layout/sidebar-provider';
import { NotificationsPopover } from '@/components/ui/notifications-popover';

const breadcrumbMap: Record<string, string> = {
  '/dashboard':              'Overview',
  '/dashboard/attendance':   'Attendance',
  '/dashboard/courses':      'Courses',
  '/dashboard/assignments':  'Assignments',
  '/dashboard/resources':    'Resources',
  '/dashboard/students':     'Students',
  '/dashboard/admin':        'Admin Panel',
  '/dashboard/reports':      'Reports',
  '/dashboard/settings':     'Settings',
  '/dashboard/announcements':'Announcements',
  '/dashboard/leaderboard':  'Leaderboard',
  '/dashboard/calendar':     'Calendar',
};

const roleBadgeVariant = {
  student: 'student' as const,
  faculty: 'faculty' as const,
  admin:   'admin'   as const,
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu]       = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused]     = useState(false);
  const { profile, loading, displayName, role } = useUser();
  const { setIsOpen } = useSidebar();

  const handleLogout = async () => {
    setShowUserMenu(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const pageTitle = breadcrumbMap[pathname] ?? 'Dashboard';

  return (
    <header
      className="sticky top-0 z-30 flex h-[60px] flex-shrink-0 items-center"
      style={{
        background: 'oklch(0.07 0.012 255 / 0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid oklch(1 0 0 / 0.055)',
      }}
    >
      <div className="flex flex-1 items-center justify-between px-4 sm:px-5 gap-3">

        {/* Left: Hamburger + Breadcrumb */}
        <div className="flex items-center gap-2 text-sm min-w-0">
          <button
            className="md:hidden p-1.5 -ml-1 text-white/40 hover:text-white/75 transition-colors rounded-lg"
            onClick={() => setIsOpen(true)}
            aria-label="Open sidebar"
            style={{ background: 'oklch(1 0 0 / 0)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(1 0 0 / 0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'oklch(1 0 0 / 0)')}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/dashboard"
            className="hidden sm:block text-white/35 hover:text-white/65 transition-colors text-[13px] flex-shrink-0"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Kings EC
          </Link>
          <ChevronRight className="hidden sm:block h-3 w-3 text-white/20 flex-shrink-0" />
          <span
            className="font-semibold text-white/90 truncate text-sm"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {pageTitle}
          </span>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className={cn('relative w-full transition-all duration-200', searchFocused ? 'scale-[1.01]' : '')}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none z-10" />
            <input
              id="header-search"
              type="search"
              placeholder="Search courses, students, sessions…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-9 pr-3 h-8 rounded-xl text-[13px] text-white/80 placeholder:text-white/25 outline-none transition-all duration-200"
              style={{
                background: 'oklch(1 0 0 / 0.05)',
                border: `1px solid ${searchFocused ? 'oklch(0.72 0.19 195 / 0.5)' : 'oklch(1 0 0 / 0.07)'}`,
                boxShadow: searchFocused ? '0 0 0 3px oklch(0.72 0.19 195 / 0.1)' : 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">

          {/* Notifications */}
          <div className="relative">
            <button
              id="notifications-btn"
              type="button"
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:text-white/75 transition-all duration-150"
              style={{ background: 'oklch(1 0 0 / 0.05)', border: '1px solid oklch(1 0 0 / 0.07)' }}
              aria-label="View notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              <span
                className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full animate-status-pulse"
                style={{ background: 'oklch(0.72 0.19 195)', boxShadow: '0 0 6px oklch(0.72 0.19 195 / 0.9)' }}
              />
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <NotificationsPopover onClose={() => setShowNotifications(false)} />
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px mx-0.5" style={{ background: 'oklch(1 0 0 / 0.08)' }} />

          {/* User menu trigger */}
          <div className="relative">
            <button
              id="user-menu-btn"
              type="button"
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-2 rounded-xl p-1 pl-1 pr-2 transition-all duration-150"
              style={{ background: showUserMenu ? 'oklch(1 0 0 / 0.07)' : 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(1 0 0 / 0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = showUserMenu ? 'oklch(1 0 0 / 0.07)' : 'transparent')}
              aria-expanded={showUserMenu}
              aria-label="User menu"
            >
              {loading ? (
                <div className="h-7 w-7 rounded-full animate-pulse" style={{ background: 'oklch(0.15 0.02 255)' }} />
              ) : (
                <Avatar name={displayName} size="sm" ring="violet" glow />
              )}
              <div className="hidden sm:block text-left">
                {loading ? (
                  <div className="space-y-1">
                    <div className="h-2.5 w-20 rounded-full animate-pulse" style={{ background: 'oklch(0.15 0.02 255)' }} />
                    <div className="h-2 w-12 rounded-full animate-pulse" style={{ background: 'oklch(0.15 0.02 255)' }} />
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] font-semibold text-white/85 leading-none">{displayName}</p>
                    <Badge variant={roleBadgeVariant[role]} className="mt-0.5 px-1.5 py-0 text-[9px] h-3.5">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  </>
                )}
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50 animate-slide-in-up"
                  style={{
                    background: 'oklch(0.10 0.016 255)',
                    border: '1px solid oklch(1 0 0 / 0.09)',
                    boxShadow: '0 20px 60px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(1 0 0 / 0.04)',
                    backdropFilter: 'blur(24px)',
                  }}
                >
                  {/* Profile header */}
                  <div className="p-3.5" style={{ borderBottom: '1px solid oklch(1 0 0 / 0.07)' }}>
                    <p className="text-[13px] font-semibold text-white/90 truncate">{displayName}</p>
                    <p className="text-[11px] text-white/35 truncate mt-0.5">{profile?.email ?? '—'}</p>
                    <Badge variant={roleBadgeVariant[role]} dot className="mt-2 text-[10px] h-4 px-2">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-0.5">
                    {[
                      { href: '/dashboard/settings', icon: User, label: 'Profile' },
                      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-white/60 transition-all duration-100"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'oklch(1 0 0 / 0.06)';
                          (e.currentTarget as HTMLElement).style.color = 'oklch(0.96 0.006 250)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = '';
                          (e.currentTarget as HTMLElement).style.color = '';
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </Link>
                    ))}

                    <div className="my-1" style={{ borderTop: '1px solid oklch(1 0 0 / 0.07)' }} />

                    <button
                      onClick={handleLogout}
                      id="header-logout-btn"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all duration-100"
                      style={{ color: 'oklch(0.65 0.22 20)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(0.60 0.22 20 / 0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, oklch(0.72 0.19 195 / 0.2), oklch(0.80 0.15 80 / 0.15), transparent)' }}
      />
    </header>
  );
}
