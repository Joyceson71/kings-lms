'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, ChevronRight, Settings, LogOut, User, Menu } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useSidebar } from '@/components/layout/sidebar-provider';
import { NotificationsPopover } from '@/components/ui/notifications-popover';

const breadcrumbMap: Record<string, string> = {
  '/dashboard':               'Overview',
  '/dashboard/attendance':    'Attendance',
  '/dashboard/courses':       'Courses',
  '/dashboard/assignments':   'Assignments',
  '/dashboard/resources':     'Resources',
  '/dashboard/students':      'Students',
  '/dashboard/admin':         'Admin Panel',
  '/dashboard/reports':       'Reports',
  '/dashboard/settings':      'Settings',
  '/dashboard/announcements': 'Announcements',
  '/dashboard/leaderboard':   'Leaderboard',
  '/dashboard/calendar':      'Calendar',
};

export function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const [showUserMenu, setShowUserMenu]           = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused]         = useState(false);
  const { profile, loading, displayName, role }   = useUser();
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
      className="sticky top-0 z-30 flex h-[52px] flex-shrink-0 items-center"
      style={{
        background: '#0a0a0b',
        borderBottom: '1px solid #1a1a1d',
      }}
    >
      <div className="flex flex-1 items-center justify-between px-4 gap-3">

        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="md:hidden p-1.5 -ml-1 rounded-md text-zinc-500 hover:text-white hover:bg-[#111113] transition-colors"
            onClick={() => setIsOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-[13px]">
            <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-300 transition-colors">
              Kings EC
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-700" />
            <span className="font-medium text-white">{pageTitle}</span>
          </div>

          <span className="sm:hidden font-medium text-[13px] text-white truncate">{pageTitle}</span>
        </div>

        {/* Center: search */}
        <div className="hidden md:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600 pointer-events-none" />
            <input
              id="header-search"
              type="search"
              placeholder="Search…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-8 pr-3 h-[30px] rounded-md text-[13px] text-white placeholder:text-zinc-600 outline-none transition-all"
              style={{
                background: '#111113',
                border: `1px solid ${searchFocused ? '#6366f1' : '#1f1f23'}`,
                boxShadow: searchFocused ? '0 0 0 2px rgb(99 102 241 / 0.15)' : 'none',
              }}
            />
            <kbd
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 hidden sm:block"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">

          {/* Notifications */}
          <div className="relative">
            <button
              id="notifications-btn"
              type="button"
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative flex h-[30px] w-[30px] items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-[#111113] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full animate-status-pulse"
                style={{ background: '#6366f1' }}
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
          <div className="h-4 w-px mx-1" style={{ background: '#1f1f23' }} />

          {/* User */}
          <div className="relative">
            <button
              id="user-menu-btn"
              type="button"
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 h-[30px] text-[13px] font-medium transition-colors',
                showUserMenu ? 'bg-[#111113] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#111113]',
              )}
              aria-expanded={showUserMenu}
              aria-label="User menu"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full" style={{ background: '#1a1a1d' }} />
              ) : (
                <Avatar name={displayName} size="xs" />
              )}
              <span className="hidden sm:block max-w-[100px] truncate">
                {loading ? '' : displayName.split(' ')[0]}
              </span>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-1 w-52 rounded-lg z-50 overflow-hidden animate-slide-in-up"
                  style={{
                    background: '#111113',
                    border: '1px solid #1f1f23',
                    boxShadow: '0 8px 32px rgb(0 0 0 / 0.6), 0 0 0 1px #1f1f23',
                  }}
                >
                  {/* Info row */}
                  <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #1a1a1d' }}>
                    <p className="text-[13px] font-medium text-white truncate">{displayName}</p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{profile?.email ?? '—'}</p>
                    <span
                      className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded capitalize"
                      style={{ background: '#1a1a1d', color: '#71717a', border: '1px solid #2a2a2e' }}
                    >
                      {role}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    {[
                      { href: '/dashboard/settings', icon: User,     label: 'Profile' },
                      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 rounded-md px-2.5 h-8 text-[13px] text-zinc-400 hover:text-white hover:bg-[#1a1a1d] transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-zinc-600" />
                        {label}
                      </Link>
                    ))}

                    <div className="my-1" style={{ borderTop: '1px solid #1a1a1d' }} />

                    <button
                      onClick={handleLogout}
                      id="header-logout-btn"
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 h-8 text-[13px] text-red-500 hover:bg-[#1a1a1d] transition-colors"
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
    </header>
  );
}
