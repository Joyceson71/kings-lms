'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    // Handle PKCE flow
    if (search.includes('code=')) {
      window.location.href = `/login${search}`;
      return;
    }

    // Handle Implicit flow
    if (hash.includes('access_token=')) {
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          document.cookie = 'kings_lms_auth=true; path=/; max-age=604800; SameSite=Lax';
          router.replace('/dashboard');
        }
      });
      return () => subscription.unsubscribe();
    }

    // Normal visit
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
