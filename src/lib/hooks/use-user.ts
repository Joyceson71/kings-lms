'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, type LocalUser, type UserRole } from '@/lib/auth';

export type { UserRole };

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadUser() {
      const user: LocalUser | null = getCurrentUser();
      if (user) {
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar_url: user.avatar_url,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    loadUser();

    // Re-sync when storage changes (multi-tab)
    const handler = () => loadUser();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return {
    profile,
    loading,
    displayName,
    initials,
    role: profile?.role ?? 'student',
    isAdmin: profile?.role === 'admin',
    isFaculty: profile?.role === 'faculty' || profile?.role === 'admin',
    isStudent: profile?.role === 'student',
  };
}
