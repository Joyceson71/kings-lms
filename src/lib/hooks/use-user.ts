'use client';

import { useEffect, useState } from 'react';
import type { UserRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export type { UserRole };

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  department?: string | null;
  college?: string | null;
}

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        setProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: profileData?.full_name || session.user.user_metadata?.full_name || null,
          role: profileData?.role || 'student',
          avatar_url: profileData?.avatar_url || session.user.user_metadata?.avatar_url || null,
          department: profileData?.department || null,
          college: profileData?.college || null,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    loadUser();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });
    return () => subscription.unsubscribe();
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
