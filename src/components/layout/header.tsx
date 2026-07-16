'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, ChevronRight, Settings, LogOut, User, Menu, Sparkles } from 'lucide-react';
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

const roleColors: Record<string, string> = {
  admin:   'text-amber-400',
  faculty: 'text-emerald-400',
  student: 'text-indigo-400',
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
      className="sticky top-0 z-30 flex h-[56px] flex-shrink-0 items-center"
      style={{
        background: 'rgb(10 10 11 / 0.95)',
        borderBottom: '1px solid #1a1a1d',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
            <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-300 transition-colors font-medium">
              Kings EC
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-700" />
            <span className="font-semibold text-white">{pageTitle}</span>
          </div>

          <span className="sm:hidden font-semibold text-[13px] text-white truncate">{pageTitle}</span>
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
              className={cn(
                'w-full pl-8 pr-10 h-[32px] rounded-lg text-[13px] text-white placeholder:text-zinc-600 outline-none transition-all duration-200',
                'bg-[#111113] border',
                searchFocused
                  ? 'border-indigo-500 ring-2 ring-indigo-500/15'
                  : 'border-[#1f1f23] hover:border-[#2a2a2e]',
              )}
            />
            <kbd
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 hidden sm:block"
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
              className="relative flex h-[32px] w-[32px] items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-[#111113] transition-colors"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full animate-status-pulse"
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
                'flex items-center gap-2 rounded-lg px-2 h-[32px] text-[13px] font-medium transition-colors',
                showUserMenu ? 'bg-[#111113] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#111113]',
              )}
              aria-expanded={showUserMenu}
              aria-label="User menu"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full skeleton" />
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
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-xl z-50 overflow-hidden animate-slide-in-down"
                  style={{
                    background: '#111113',
                    border: '1px solid #1f1f23',
                    boxShadow: '0 8px 32px rgb(0 0 0 / 0.6), 0 0 0 1px #1f1f23',
                  }}
                >
                  {/* Info row */}
                  <div className="px-3 py-3" style={{ borderBottom: '1px solid #1a1a1d' }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <Avatar name={displayName} size="sm" ring="none" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{displayName}</p>
                        <p className="text-[11px] text-zinc-500 truncate mt-px">{profile?.email ?? '—'}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize',
                        'bg-[#1a1a1d] border border-[#2a2a2e]',
                        roleColors[role] ?? 'text-zinc-500',
                      )}
                    >
                      <Sparkles className="h-2.5 w-2.5" />
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
                        className="flex items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13px] text-zinc-400 hover:text-white hover:bg-[#1a1a1d] transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-zinc-600" />
                        {label}
                      </Link>
                    ))}

                    <div className="my-1" style={{ borderTop: '1px solid #1a1a1d' }} />

                    <button
                      onClick={handleLogout}
                      id="header-logout-btn"
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13px] text-red-500 hover:bg-red-500/5 transition-colors"
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
