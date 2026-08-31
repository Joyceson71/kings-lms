'use client';

import { useState, memo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, Settings, LogOut, User, Sparkles, Menu } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { useSidebar } from '@/components/layout/sidebar-provider';
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

const roleChipStyle: Record<string, { bg: string; text: string; border: string; glow: string; badgeClass: string }> = {
  admin:   { bg: 'rgb(255 215 0 / 0.1)',  text: '#FFD700', border: 'rgb(255 215 0 / 0.3)',  glow: '#FFD700', badgeClass: 'anime-badge-gold' },
  faculty: { bg: 'rgb(57 255 20 / 0.1)',  text: '#39FF14', border: 'rgb(57 255 20 / 0.3)',  glow: '#39FF14', badgeClass: 'anime-badge-volt' },
  student: { bg: 'rgb(0 245 255 / 0.1)',  text: '#00F5FF', border: 'rgb(0 245 255 / 0.3)',  glow: '#00F5FF', badgeClass: 'anime-badge-cyan' },
};

export const Header = memo(function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const [showUserMenu, setShowUserMenu]           = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused]         = useState(false);
  const { profile, loading, displayName, role }   = useUser();
  const { setIsOpen }                             = useSidebar();

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
        background: 'rgba(13, 13, 30, 0.95)',
        borderBottom: '2px solid #252545',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        boxShadow: '0 1px 0 #252545, 0 4px 20px rgb(0 0 0 / 0.4), 0 0 40px rgb(255 0 110 / 0.03)',
      }}
    >
      {/* Anime energy bar at very top of header */}
      <div className="absolute top-0 left-0 right-0 energy-bar-thin" />

      <div className="flex flex-1 items-center justify-between px-4 gap-4">

        {/* Left: logo (mobile) + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile: Hamburger + Logo */}
          <button 
            className="md:hidden flex items-center justify-center p-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link href="/dashboard" className="md:hidden flex items-center gap-2 flex-shrink-0">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                boxShadow: '0 0 12px rgb(129 140 248 / 0.4)',
              }}
            >
              <span className="text-foreground text-[10px] font-black">K</span>
            </div>
          </Link>

          {/* Desktop: brutalist breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-[13px]">
            <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-black text-[11px] tracking-wider uppercase">
              Kings EC
            </Link>
            <span className="text-muted-foreground/40 font-black">{'»'}</span>
            <span className="font-black text-foreground tracking-tight uppercase text-[14px] glitch-text">{pageTitle}</span>
          </div>

          {/* Mobile: page title */}
          <span className="md:hidden font-black text-[15px] text-foreground truncate mt-[1px] uppercase tracking-tight glitch-text"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
            {pageTitle}
          </span>
        </div>

        {/* Center: neomorphic search (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="header-search"
              type="search"
              placeholder="Search…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'w-full pl-9 pr-10 h-[34px] rounded-md text-[13px] text-foreground placeholder:text-muted-foreground transition-all duration-200 neo-input',
                searchFocused ? 'border-primary' : '',
              )}
            />
            <kbd
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hidden sm:block"
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
              className="relative flex h-[34px] w-[34px] items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-all duration-150 neo-btn"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full animate-status-pulse"
                style={{ background: '#FF006E', boxShadow: '0 0 8px #FF006E' }}
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
          <div className="h-5 w-px mx-0.5" style={{ background: '#252545' }} />

          {/* User menu */}
          <div className="relative">
            <button
              id="user-menu-btn"
              type="button"
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 h-[34px] text-[13px] font-semibold transition-all duration-150',
                showUserMenu
                  ? 'text-foreground neo-inset'
                  : 'text-muted-foreground hover:text-foreground neo-btn',
              )}
              aria-expanded={showUserMenu}
              aria-label="User menu"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full skeleton" />
              ) : (
                <Avatar name={displayName} size="xs" />
              )}
              <div className="hidden sm:flex items-center gap-2">
                <span className="max-w-[90px] truncate text-[12px]">
                  {loading ? '' : displayName.split(' ')[0]}
                </span>
                {!loading && (
                  <span className={cn('anime-badge inline-flex items-center gap-1', chip.badgeClass)}>
                    {role}
                  </span>
                )}
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-60 rounded-xl z-50 overflow-hidden animate-slide-in-down"
                  style={{
                    background: '#0D0D1E',
                    border: '2px solid #252545',
                    boxShadow: '8px 8px 0 rgb(255 0 110 / 0.15), 0 20px 50px rgb(0 0 0 / 0.8)',
                  }}
                >
                  {/* User info */}
                  <div className="p-4" style={{ borderBottom: '1px solid #1a1a3a' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={displayName} size="sm" ring="none" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-px">{profile?.email ?? '—'}</p>
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
                        className="flex items-center gap-3 rounded-xl px-3 h-9 text-[13px] text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
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
