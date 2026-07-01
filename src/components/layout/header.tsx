'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, ChevronRight, Settings, LogOut, User, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/layout/sidebar-provider';

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/attendance': 'Attendance',
  '/dashboard/courses': 'Courses',
  '/dashboard/assignments': 'Assignments',
  '/dashboard/students': 'Students',
  '/dashboard/admin': 'Admin Panel',
  '/dashboard/reports': 'Reports',
  '/dashboard/settings': 'Settings',
};

const roleBadgeVariant = {
  student: 'student' as const,
  faculty: 'faculty' as const,
  admin: 'admin' as const,
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { profile, loading, displayName, role } = useUser();
  const { setIsOpen } = useSidebar();

  const handleLogout = async () => {
    setShowUserMenu(false);
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  const pageTitle = breadcrumbMap[pathname] ?? 'Dashboard';

  return (
    <header
      className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center border-b border-border/60"
      style={{
        background: 'oklch(0.08 0.015 265 / 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex flex-1 items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4">
        {/* Left: Hamburger + Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 text-sm min-w-0">
          <button
            className="md:hidden p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
            onClick={() => setIsOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link href="/dashboard" className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            Kings EC
          </Link>
          <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
          <span className="font-semibold text-foreground truncate text-base sm:text-sm">{pageTitle}</span>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className={cn('relative w-full transition-all duration-300', searchFocused ? 'scale-[1.01]' : '')}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              id="header-search"
              type="search"
              placeholder="Search courses, students, sessions…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'pl-9 h-9 rounded-xl bg-secondary/50 border-border/40 text-foreground placeholder:text-muted-foreground/50',
                'focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200',
                searchFocused && 'shadow-[0_0_20px_oklch(0.65_0.26_285/0.2)] bg-secondary/70'
              )}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notifications */}
          <button
            id="notifications-btn"
            type="button"
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 hover:shadow-[0_0_12px_oklch(0.65_0.26_285/0.2)]"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary animate-status-pulse shadow-[0_0_6px_oklch(0.65_0.26_285/0.8)]" />
          </button>

          <div className="h-5 sm:h-6 w-px bg-border/50 mx-0.5 sm:mx-1" />

          {/* User menu */}
          <div className="relative">
            <button
              id="user-menu-btn"
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 sm:gap-2.5 rounded-xl p-1 sm:px-2 sm:py-1.5 hover:bg-secondary/60 transition-all duration-200"
              aria-expanded={showUserMenu}
              aria-label="User menu"
            >
              {loading ? (
                <div className="h-7 w-7 rounded-full bg-secondary animate-pulse" />
              ) : (
                <Avatar name={displayName} size="sm" ring="violet" glow />
              )}
              <div className="hidden sm:block text-left">
                {loading ? (
                  <div className="space-y-1">
                    <div className="h-2.5 w-20 rounded-full bg-secondary animate-pulse" />
                    <div className="h-2 w-12 rounded-full bg-secondary animate-pulse" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-foreground leading-none">{displayName}</p>
                    <Badge variant={roleBadgeVariant[role]} className="mt-0.5 px-1.5 py-0 text-[10px]">
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
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border/60 shadow-xl z-50 overflow-hidden animate-slide-in-up"
                  style={{ background: 'oklch(0.11 0.02 265)', backdropFilter: 'blur(20px)' }}
                >
                  <div className="p-3 border-b border-border/50">
                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email ?? '—'}</p>
                    <Badge variant={roleBadgeVariant[role]} dot className="mt-1.5">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <div className="border-t border-border/50 my-1" />
                    <button
                      onClick={handleLogout}
                      id="header-logout-btn"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </header>
  );
}
