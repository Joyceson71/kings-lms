'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        // Skip onboarding check for local-auth users (they have no Supabase profile)
        const localAuth = document.cookie.includes('kings_lms_auth=true');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && localAuth) {
          setIsLoading(false);
          return; // Local-auth users skip onboarding
        }

        if (!user) {
          setIsLoading(false);
          return; // Middleware should catch this, but just in case
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('department, roll_number, college, year_of_study')
          .eq('id', user.id)
          .maybeSingle();

        // If the user's profile is missing required details, redirect to onboarding
        if (!profile?.department || !profile?.college) {
          router.replace('/onboarding');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
