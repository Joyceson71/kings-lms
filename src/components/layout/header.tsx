'use client';

import { useState, memo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, ChevronRight, Settings, LogOut, User, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
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

const roleChipStyle: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  admin:   { bg: 'rgb(251 191 36 / 0.1)',  text: '#fde68a', border: 'rgb(251 191 36 / 0.2)',  glow: '#fbbf24' },
  faculty: { bg: 'rgb(52 211 153 / 0.1)',  text: '#6ee7b7', border: 'rgb(52 211 153 / 0.2)',  glow: '#34d399' },
  student: { bg: 'rgb(129 140 248 / 0.1)', text: '#a5b4fc', border: 'rgb(129 140 248 / 0.2)', glow: '#818cf8' },
};

export const Header = memo(function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const [showUserMenu, setShowUserMenu]           = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused]         = useState(false);
  const { profile, loading, displayName, role }   = useUser();

  const handleLogout = async () => {
    setShowUserMenu(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const pageTitle = breadcrumbMap[pathname] ?? 'Dashboard';
  const chip = roleChipStyle[role] ?? roleChipStyle.student;

  return (
    <header
      className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center"
      style={{
        background: 'rgba(4, 4, 12, 0.92)',
        borderBottom: '1px solid #1a1a3a',
        backdropFilter: 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        boxShadow: '0 1px 0 #1a1a3a, 0 4px 20px rgb(0 0 0 / 0.3)',
      }}
    >
      <div className="flex flex-1 items-center justify-between px-4 gap-4">

        {/* Left: logo (mobile) + breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile: Logo only (no hamburger — bottom nav handles it) */}
          <Link href="/dashboard" className="md:hidden flex items-center gap-2 flex-shrink-0">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                boxShadow: '0 0 12px rgb(129 140 248 / 0.4)',
              }}
            >
              <span className="text-white text-[10px] font-black">K</span>
            </div>
          </Link>

          {/* Desktop: breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-[13px]">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-300 transition-colors font-medium">
              Kings EC
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-700" />
            <span className="font-semibold text-white">{pageTitle}</span>
          </div>

          {/* Mobile: page title */}
          <span className="md:hidden font-bold text-[14px] text-white truncate"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
            {pageTitle}
          </span>
        </div>

        {/* Center: search (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
            <input
              id="header-search"
              type="search"
              placeholder="Search…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'w-full pl-9 pr-10 h-[34px] rounded-xl text-[13px] text-white placeholder:text-slate-700 outline-none transition-all duration-200',
                'border',
                searchFocused
                  ? 'border-indigo-500/50 ring-2 ring-indigo-500/10 bg-[#0c0c20]'
                  : 'border-[#1a1a3a] bg-[#08081c] hover:border-[#2d2d5e]',
              )}
            />
            <kbd
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-700 hidden sm:block"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">

          {/* Notifications */}
          <div className="relative">
            <button
              id="notifications-btn"
              type="button"
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative flex h-[34px] w-[34px] items-center justify-center rounded-xl text-slate-500 hover:text-white transition-all duration-150"
              style={{ background: showNotifications ? 'rgb(129 140 248 / 0.1)' : undefined }}
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full animate-status-pulse"
                style={{ background: '#818cf8', boxShadow: '0 0 6px #818cf8' }}
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
          <div className="h-5 w-px mx-0.5" style={{ background: '#1a1a3a' }} />

          {/* User menu */}
          <div className="relative">
            <button
              id="user-menu-btn"
              type="button"
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-2 h-[34px] text-[13px] font-medium transition-all duration-150',
                showUserMenu
                  ? 'bg-[#0c0c20] text-white ring-1 ring-[#1a1a3a]'
                  : 'text-slate-400 hover:text-white hover:bg-[#08081c]',
              )}
              aria-expanded={showUserMenu}
              aria-label="User menu"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full skeleton" />
              ) : (
                <Avatar name={displayName} size="xs" />
              )}
              <span className="hidden sm:block max-w-[90px] truncate text-[12px]">
                {loading ? '' : displayName.split(' ')[0]}
              </span>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-60 rounded-2xl z-50 overflow-hidden animate-slide-in-down"
                  style={{
                    background: '#08081c',
                    border: '1px solid #1a1a3a',
                    boxShadow: '0 16px 48px rgb(0 0 0 / 0.7), 0 0 0 1px #1a1a3a, 0 0 40px rgb(129 140 248 / 0.05)',
                  }}
                >
                  {/* User info */}
                  <div className="p-4" style={{ borderBottom: '1px solid #1a1a3a' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={displayName} size="sm" ring="none" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-px">{profile?.email ?? '—'}</p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg capitalize tracking-wider"
                      style={{
                        background: chip.bg,
                        color: chip.text,
                        border: `1px solid ${chip.border}`,
                        boxShadow: `0 0 8px ${chip.glow}40`,
                      }}
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {role}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5">
                    {[
                      { href: '/dashboard/settings', icon: User,     label: 'Profile' },
                      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 rounded-xl px-3 h-9 text-[13px] text-slate-400 hover:text-white hover:bg-[#0f0f28] transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-slate-600" />
                        {label}
                      </Link>
                    ))}

                    <div className="my-1.5 h-px mx-2" style={{ background: '#1a1a3a' }} />

                    <button
                      onClick={handleLogout}
                      id="header-logout-btn"
                      className="flex w-full items-center gap-3 rounded-xl px-3 h-9 text-[13px] text-red-400 hover:bg-red-500/5 transition-colors"
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
});
